"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (provider: 'google' | 'kakao') => Promise<void>;
    logout: () => Promise<void>;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    user: any | null;
    credits: number;
    refreshCredits: () => Promise<void>;
    supabase: any; // Type as any or SupabaseClient
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [supabase] = useState(() => createClient());
    const pathname = usePathname();

    const fetchCredits = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setCredits(data.credits);
            }
        } catch (error) {
            console.error("Error fetching credits:", error);
        }
    };

    useEffect(() => {
        let mounted = true;

        // One-time session check on mount + set up listener
        const initializeAuth = async () => {
            // 1. Set up listener FIRST to catch any state changes immediately
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (!mounted) return;

                if (session?.user) {
                    console.log("AuthContext: Auth State Changed -> Logged In");
                    setUser(session.user);
                    setIsLoggedIn(true);
                    setIsLoginModalOpen(false);
                    await fetchCredits(session.user.id);
                } else {
                    console.log("AuthContext: Auth State Changed -> Logged Out");
                    setUser(null);
                    setIsLoggedIn(false);
                    setCredits(0);
                }
                setIsLoading(false);
            });

            // 2. Perform initial getSession primarily to handle cases where onAuthStateChange doesn't fire immediately (edge case)
            // But honestly, onAuthStateChange is reliable.
            // Let's just do a quick check but NOT force logout if it fails/timeouts.
            // We just want to ensure we don't start as "Logged Out" if we have a session.

            try {
                // We don't wait for this if onAuthStateChange fires.
                // But we should ensure isLoading turns off EVENTUALLY if onAuthStateChange never fires (e.g. Supabase script fails).
                // Safety timeout for LOADING state only.
                setTimeout(() => {
                    if (mounted) setIsLoading((prev) => false);
                }, 4000);

            } catch (err) {
                console.error("Auth init error:", err);
            }

            return () => {
                mounted = false;
                subscription.unsubscribe();
            };
        };

        const cleanupPromise = initializeAuth();

        return () => {
            mounted = false;
            // cleanup is handled inside initializeAuth logic via variable return
        };
    }, [supabase]);

    const refreshCredits = async () => {
        if (user) {
            await fetchCredits(user.id);
        }
    };

    const login = async (provider: 'google' | 'kakao') => {
        try {
            const next = pathname;
            const redirectTo = `${window.location.origin}/auth/callback?next=${next}`;

            await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: redirectTo,
                },
            });
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUser(null);
        setCredits(0);
        window.location.reload();
    };

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            isLoading,
            login,
            logout,
            isLoginModalOpen,
            openLoginModal,
            closeLoginModal,
            user,
            credits,
            refreshCredits,
            supabase
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
