'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/app/actions';

export default function ActivityLogger() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isLoggedIn, user } = useAuth();

    useEffect(() => {
        if (isLoggedIn && user) {
            // Delay slightly to ensure page is loaded (?) or just fire
            // Debounce could be good but requirements "Page Visit" usually means each navigation.
            // Using pathname + searchParams string as full path
            const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

            // Log it
            logActivity('PAGE_VISIT', fullPath);
            // console.log("Logged visit:", fullPath);
        }
    }, [pathname, searchParams, isLoggedIn, user]);

    return null; // Renderless component
}
