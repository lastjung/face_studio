'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LayoutDashboard, Users, CreditCard, RefreshCcw, Package, LogOut } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading, logout, supabase } = useAuth(); // Use Global Auth Context & Client
    const [isAdminLoading, setIsAdminLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    // const supabase = createClient(); // Removed local client creation

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Wait for Global Auth to finish first
        if (isAuthLoading) return;

        console.log("AdminLayout: AuthContext finished loading", { user: user?.id, isLoginPage });

        const verifyAdmin = async () => {
            if (!user) {
                if (!isLoginPage) {
                    // Force redirect if not logged in
                    console.log("AdminLayout: No user, redirecting to login");
                    router.push('/admin/login');
                } else {
                    console.log("AdminLayout: Login page, stop loading");
                    setIsAdminLoading(false);
                }
                return;
            }

            // User exists, now check Role via Server Action (Bypasses Client Network Issues)
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    attempts++;

                    // Import dynamically to avoid circular dependencies if any (though clear here)
                    const { checkAdminRole } = await import('./actions');
                    const { isAdmin, error } = await checkAdminRole();

                    if (error) {
                        console.warn(`AdminLayout check attempt ${attempts} failed:`, error);
                        if (attempts >= maxAttempts) throw new Error(error);
                        // Access denied is fatal, no retry needed
                        if (error === "Not Admin" || error === "No User" || error === "Unauthorized" || error === "Forbidden") {
                            throw new Error(error);
                        }
                        // Retryable error (network etc)
                        await new Promise(r => setTimeout(r, 1000));
                        continue;
                    }

                    if (!isAdmin) {
                        console.log("AdminLayout: Not Admin (Server Verified)");
                        toast.error("관리자 권한이 없습니다.");
                        router.push('/');
                        return;
                    }

                    // Authorized!
                    console.log("AdminLayout: Authorized Admin!");
                    setIsAuthorized(true);
                    setIsAdminLoading(false);

                    if (isLoginPage) {
                        router.push('/admin');
                    }
                    return; // Exit successful

                } catch (e: any) {
                    console.error(`AdminLayout check attempt ${attempts} failed:`, e.message);

                    if (attempts >= maxAttempts) {
                        setIsAdminLoading(false);
                        if (e.message === "Not Admin" || e.message === "Forbidden") {
                            toast.error("관리자 권한이 없습니다.");
                            router.push('/');
                        } else {
                            toast.error("서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
                        }
                    }
                }
            }
        };

        verifyAdmin();

    }, [user, isAuthLoading, pathname]);

    // Combined Loading State
    if (isAuthLoading || (isAdminLoading && !isLoginPage && user)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Login Page (No Sidebar)
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Unauthorized Guard
    if (!isAuthorized) return null;

    // Admin Layout with Sidebar
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <div className="bg-gray-900 text-white p-1 rounded">
                        <LayoutDashboard size={20} />
                    </div>
                    <span className="font-bold text-lg text-gray-900">Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem href="/admin" icon={<LayoutDashboard size={18} />} label="대시보드" active={pathname === '/admin'} />
                    <SidebarItem href="/admin/users" icon={<Users size={18} />} label="회원 관리" active={pathname.startsWith('/admin/users')} />
                    <SidebarItem href="/admin/payments" icon={<CreditCard size={18} />} label="결제 관리" active={pathname.startsWith('/admin/payments')} />
                    <SidebarItem href="/admin/refunds" icon={<RefreshCcw size={18} />} label="환불 관리" active={pathname.startsWith('/admin/refunds')} />
                    <SidebarItem href="/admin/plans" icon={<Package size={18} />} label="요금제 관리" active={pathname.startsWith('/admin/plans')} />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={async () => {
                            await logout();
                            router.push('/admin/login');
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

function SidebarItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100 text-gray-700'
                }`}
        >
            {icon}
            {label}
        </Link>
    );
}
