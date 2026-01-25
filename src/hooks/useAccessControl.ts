'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function useAccessControl() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const checkBasicAccess = useCallback((redirect = true) => {
        if (status === 'loading') return 'loading';

        if (!session?.user) {
            if (redirect) router.push('/login');
            return false;
        }

        const user = session.user as any;
        if (user.role === 'admin') return true;

        if ((user.profileCompletion || 0) < 70) {
            if (redirect) {
                toast.error("Complete your profile (70%) to access this feature.");
                // router.push('/profile/edit'); // Optional: redirect to edit
            }
            return false;
        }
        return true;
    }, [session, status, router]);

    const checkVerifiedAccess = useCallback((redirect = true) => {
        if (status === 'loading') return 'loading';

        if (!session?.user) {
            if (redirect) router.push('/login');
            return false;
        }

        const user = session.user as any;
        if (user.role === 'admin') return true;

        if (!user.isVerified) {
            if (redirect) {
                toast.error("You must be a Verified User to access this feature.");
            }
            return false;
        }
        return true;
    }, [session, status, router]);

    // Explicitly for Adding Resource which is Open Access
    const checkOpenAccess = useCallback((redirect = true) => {
        if (status === 'loading') return 'loading';
        if (!session?.user) {
            if (redirect) router.push('/login');
            return false;
        }
        return true;
    }, [status, session, router]);

    return {
        checkBasicAccess,
        checkVerifiedAccess,
        checkOpenAccess,
        user: session?.user as any,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated'
    };
}
