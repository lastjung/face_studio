"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import GalleryGrid from "@/components/GalleryGrid";
import ImageModal, { GalleryImage } from "@/components/ImageModal";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { X } from "lucide-react";

const PAGE_SIZE = 20;

export default function GalleryPage() {
    const { isLoggedIn } = useAuth();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [visibleImages, setVisibleImages] = useState<GalleryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    const observerTarget = useRef<HTMLDivElement>(null);

    // createClient Safe Init
    let supabase: any;
    try {
        supabase = createClient();
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }
    // const supabase = createClient();

    // 1. Fetch Real Data from Supabase
    const fetchImages = useCallback(async (isInitial = false) => {
        try {
            if (!supabase) {
                console.error("Supabase client not initialized");
                setLoading(false);
                return;
            }
            // Get current user session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                setLoading(false);
                return;
            }

            const from = isInitial ? 0 : images.length;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await supabase
                .from('images')
                .select('*', { count: 'exact' })
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data) {
                // Map DB schema to GalleryImage interface
                const newImages: GalleryImage[] = data.map((img: any) => ({
                    id: img.id,
                    url: img.storage_url, // URL from DB
                    prompt: img.prompt,
                    createdAt: img.created_at,
                    model: img.model
                }));

                if (isInitial) {
                    setImages(newImages);
                    setVisibleImages(newImages); // For now, let's keep it simple: images = visibleImages
                } else {
                    setImages(prev => [...prev, ...newImages]);
                    setVisibleImages(prev => [...prev, ...newImages]);
                }

                // Check if we reached the end
                if (count !== null && (from + newImages.length) >= count) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    }, [images.length, supabase]);

    // Initial Load
    useEffect(() => {
        if (isLoggedIn) {
            fetchImages(true);
        } else {
            setLoading(false);
            setImages([]);
            setVisibleImages([]);
        }
    }, [isLoggedIn]); // Only depend on auth state change (and fetchImages inside if needed, but safer to just trigger on login)


    // 2. Infinite Scroll Logic
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
            fetchImages(false);
        }
    }, [fetchImages, hasMore, loading]);

    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "20px",
            threshold: 0
        };
        const observer = new IntersectionObserver(handleObserver, option);
        if (observerTarget.current) observer.observe(observerTarget.current);

        return () => observer.disconnect();
    }, [handleObserver]);

    return (
        <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        내 갤러리
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        나만의 특별한 이미지를 모아볼 수 있습니다.
                        {isLoggedIn && (
                            <span className="text-gray-900 dark:text-gray-200 font-medium ml-1">
                                총 {images.length}개의 이미지
                            </span>
                        )}
                    </p>
                </div>
                <Link
                    href="/"
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"
                    title="메인으로 돌아가기"
                >
                    <X className="w-8 h-8" />
                </Link>
            </div>

            {!isLoggedIn ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p>로그인이 필요한 서비스입니다.</p>
                </div>
            ) : (
                <>
                    {/* Grid */}
                    <GalleryGrid
                        images={visibleImages}
                        onImageClick={(img) => setSelectedImage(img)}
                    />

                    {/* Infinite Scroll Sentinel */}
                    {hasMore && (
                        <div
                            ref={observerTarget}
                            className="h-20 flex items-center justify-center text-gray-400"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <ImageModal
                isOpen={!!selectedImage}
                image={selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </main>
    );
}
