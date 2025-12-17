"use client";

import { X, Download, Trash2, Calendar, Wand2 } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export interface GalleryImage {
    id: string;
    url: string;
    prompt: string;
    createdAt: string;
    model: string;
}

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: GalleryImage | null;
}

export default function ImageModal({
    isOpen,
    onClose,
    image,
}: ImageModalProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !image) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button (Mobile: Top Right, Desktop: Absolute outside or inside corner) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Left: Image Area */}
                <div className="w-full md:w-2/3 h-1/2 md:h-full bg-black/5 dark:bg-black flex items-center justify-center relative p-4">
                    <div className="relative w-full h-full">
                        <Image
                            src={image.url}
                            alt={image.prompt}
                            fill
                            className="object-contain" // Key requirement: Show full image
                            sizes="(max-width: 768px) 100vw, 66vw"
                            priority
                        />
                    </div>
                </div>

                {/* Right: Details Area */}
                <div className="w-full md:w-1/3 h-1/2 md:h-full bg-white dark:bg-gray-900 p-6 flex flex-col border-l border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            이미지 상세
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6">
                        {/* Prompt Section */}
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                <Wand2 size={16} />
                                <span>프롬프트</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {image.prompt}
                            </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <span className="text-xs text-gray-400 block mb-1">모델</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {image.model || "Imagen 3.0"}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block mb-1">생성일</span>
                                <span className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                                    <Calendar size={14} className="text-gray-400" />
                                    {new Date(image.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 mt-auto flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-xl font-medium transition-colors shadow-lg shadow-gray-200 dark:shadow-none">
                            <Download size={18} />
                            <span>다운로드</span>
                        </button>
                        <button className="flex-none p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
