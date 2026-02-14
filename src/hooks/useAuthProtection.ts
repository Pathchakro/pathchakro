import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { calculateProfileCompletion } from '@/lib/utils';
import { toast } from 'sonner';

interface AuthProtectionOptions {
    requireAuth?: boolean;
    requireProfileCompletion?: boolean;
    redirectUrl?: string;
    checkOnMount?: boolean;
}

export function useAuthProtection(options: AuthProtectionOptions = {}) {
    const {
        requireAuth = true,
        requireProfileCompletion = true,
        redirectUrl = '/',
        checkOnMount = true
    } = options;

    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // State to track if we should show the profile completion modal
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        // If auth is not required, we are authorized by default
        if (!requireAuth) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
        }

        if (requireAuth && !session) {
            setIsAuthorized(false);
            setIsLoading(false);
            if (redirectUrl) {
                router.push(redirectUrl);
            }
            return;
        }

        if (requireAuth && session && requireProfileCompletion) {
            const completion = (session.user as any).profileCompletion ?? calculateProfileCompletion(session.user);

            if (completion < 70) {
                setIsAuthorized(false);
                if (checkOnMount) {
                    setShowProfileModal(true);
                }
            } else {
                setIsAuthorized(true);
            }
        } else if (requireAuth && session) {
            setIsAuthorized(true);
        }

        setIsLoading(false);
    }, [session, status, requireAuth, requireProfileCompletion, checkOnMount]);

    const checkAuth = useCallback(() => {
        if (!session) {
            // Trigger login
            signIn('google', { callbackUrl: pathname });
            return false;
        }

        if (requireProfileCompletion) {
            const completion = (session.user as any).profileCompletion ?? calculateProfileCompletion(session.user);
            if (completion < 70) {
                setIsAuthorized(false); // Ensure state reflects unauthorized
                setShowProfileModal(true);
                toast.error("Please complete your profile to proceed.");
                return false;
            }
        }

        return true;
    }, [session, pathname, requireProfileCompletion]);

    return {
        isAuthorized,
        isLoading,
        isAuthenticated: !!session,
        showProfileModal,
        setShowProfileModal,
        checkAuth
    };
}
