"use client";

import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

export default function LoginModal() {
    const { isLoginModalOpen, closeLoginModal, login } = useAuth();

    if (!isLoginModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={closeLoginModal}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">로그인/회원가입</h2>
                    <p className="text-sm text-gray-500 word-keep-all">
                        딸깍 스튜디오에서 나만의 특별한 이미지를 만들어보세요
                    </p>
                </div>

                {/* Social Login Buttons */}
                <div className="flex flex-col gap-3">
                    {/* Google Login */}
                    <button
                        onClick={() => login('google')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-100 py-3.5 text-black hover:bg-gray-200 transition-colors font-medium relative group"
                    >
                        {/* Google Logo SVG (Inline) */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23.52 12.29C23.52 11.43 23.45 10.61 23.3 9.82H12V14.47H18.47C18.18 15.93 17.32 17.17 16.05 18.01V20.94H19.92C22.18 18.86 23.52 15.82 23.52 12.29Z" fill="#4285F4" />
                            <path d="M12 24C15.24 24 17.96 22.92 19.93 21.1L16.05 18.01C14.97 18.73 13.59 19.16 12 19.16C8.87 19.16 6.22 17.05 5.27 14.19H1.27V17.29C3.25 21.22 7.31 24 12 24Z" fill="#34A853" />
                            <path d="M5.27 14.19C5.03 13.33 4.89 12.43 4.89 11.5C4.89 10.57 5.02 9.67 5.26 8.81V5.7H1.26C0.46 7.29 0 9.15 0 11.5C0 13.84 0.46 15.71 1.27 17.29L5.27 14.19Z" fill="#FBBC05" />
                            <path d="M12 3.83C13.76 3.83 15.34 4.43 16.59 5.61L19.98 2.22C17.95 0.33 15.23 0 12 0C7.31 0 3.25 2.78 1.27 6.7L5.27 9.81C6.22 6.95 8.87 3.83 12 3.83Z" fill="#EA4335" />
                        </svg>
                        <span>구글로 계속하기</span>
                    </button>

                    {/* Kakao Login */}
                    <button
                        onClick={() => login('kakao')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] py-3.5 text-black hover:bg-[#FDD835] transition-colors font-medium relative group"
                    >
                        {/* Kakao Logo SVG (Inline - Simple Placeholder Shape or approximate if complex, using a simple Chat Bubble shape for now as strict SVG text is hard, but user asked for logo. I will use a simplified path for Kakao Talk symbol) */}
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3C7.58 3 4 5.79 4 9.24C4 11.23 5.34 12.99 7.42 14.1L6.37 17.95C6.3 18.22 6.61 18.43 6.83 18.28L11.39 15.25C11.59 15.26 11.79 15.27 12 15.27C16.42 15.27 20 12.48 20 9.24C20 5.79 16.42 3 12 3Z" fill="#3A1D1D" />
                        </svg>
                        <span>카카오로 계속하기</span>
                    </button>
                </div>

                {/* Footer or Terms (Optional but good for completeness) */}
                <p className="mt-6 text-center text-xs text-gray-400">
                    로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                </p>
            </div>
        </div>
    );
}
