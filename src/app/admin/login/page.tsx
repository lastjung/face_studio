'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberEmail, setRememberEmail] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const savedEmail = localStorage.getItem('adminEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberEmail(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Handle Remember Email
        if (rememberEmail) {
            localStorage.setItem('adminEmail', email);
        } else {
            localStorage.removeItem('adminEmail');
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || profile?.role !== 'Admin') {
                await supabase.auth.signOut();
                toast.error("관리자 계정이 아닙니다.");
                return;
            }

            toast.success("관리자 로그인 성공");
            router.push('/admin');
            router.refresh(); // Refresh to update layout state

        } catch (e: any) {
            toast.error("로그인 실패", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-gray-900 p-8 text-center">
                    <div className="mx-auto bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white backdrop-blur-sm">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">관리자 로그인</h1>
                    <p className="text-gray-400 text-sm">시스템 관리자 전용 페이지입니다.</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                                placeholder="name@company.com"
                                required
                                autoComplete="email"
                                name="email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                name="password"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-email"
                                type="checkbox"
                                checked={rememberEmail}
                                onChange={(e) => setRememberEmail(e.target.checked)}
                                className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-email" className="ml-2 block text-sm text-gray-700">
                                이메일 기억하기
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin h-5 w-5" />}
                            로그인
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-gray-500 hover:text-gray-900 underline">
                            메인 페이지로 돌아가기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
