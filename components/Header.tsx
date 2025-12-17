"use client";

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { isLoggedIn, openLoginModal, credits } = useAuth();

    const handleProtectedLink = (e: React.MouseEvent, href?: string) => {
        console.log("Link clicked. IsLoggedIn:", isLoggedIn);
        if (!isLoggedIn) {
            e.preventDefault();
            console.log("Opening Login Modal...");
            openLoginModal();
        }
        // If logged in, let default Link behavior happen (or button onClick)
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Face Studio</span>
                </Link>

                {/* Navigation */}
                <nav className="hidden items-center gap-8 md:flex">
                    <Link href="/" onClick={(e) => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-medium text-gray-600 hover:text-black">
                        이미지 생성
                    </Link>
                    <Link href="/gallery" onClick={(e) => handleProtectedLink(e)} className="text-sm font-medium text-gray-600 hover:text-black">
                        내 갤러리
                    </Link>
                    <Link href="/pricing" onClick={(e) => handleProtectedLink(e)} className="text-sm font-medium text-gray-600 hover:text-black">
                        요금제
                    </Link>
                    <Link href="/credits/history" onClick={(e) => handleProtectedLink(e)} className="text-sm font-medium text-gray-600 hover:text-black">
                        사용내역
                    </Link>
                </nav>

                {/* Action Button */}
                <div className="flex items-center gap-4">
                    {isLoggedIn && (
                        <div className="hidden items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 md:flex">
                            <span className="text-lg">🪙</span>
                            <span className="text-sm font-semibold text-gray-900">{credits?.toLocaleString() ?? 0}</span>
                        </div>
                    )}

                    {isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            {/* Optional: Show User Avatar or Name if available, for now just Logout or Gallery button */}
                            <Link
                                href="/gallery"
                                className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200"
                            >
                                내 갤러리
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={() => openLoginModal()}
                            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            로그인 / 시작하기
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
