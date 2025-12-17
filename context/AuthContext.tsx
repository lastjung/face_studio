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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // Supabase client
    const supabase = createClient();
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
        // Check active session
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    setIsLoggedIn(true);
                    await fetchCredits(session.user.id);
                } else {
                    setUser(null);
                    setIsLoggedIn(false);
                    setCredits(0);
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                setIsLoggedIn(true);
                setIsLoginModalOpen(false); // Close modal on successful login
                await fetchCredits(session.user.id);
            } else {
                setUser(null);
                setIsLoggedIn(false);
                setCredits(0);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const refreshCredits = async () => {
        if (user) {
            await fetchCredits(user.id);
        }
    };

    const login = async (provider: 'google' | 'kakao') => {
        try {
            const next = pathname; // Redirect back to current path
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
        window.location.reload(); // Refresh to clear any server-side state
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
            refreshCredits
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
