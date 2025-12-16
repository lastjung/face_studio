import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Header() {
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
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black">
                        이미지 생성
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black">
                        내 갤러리
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black">
                        요금제
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black">
                        사용내역
                    </Link>
                </nav>

                {/* Action Button */}
                <div className="flex items-center gap-4">
                    <button className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                        시작하기
                    </button>
                </div>
            </div>
        </header>
    );
}
