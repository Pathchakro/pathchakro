'use client';

import { useEffect } from 'react';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requireProfileCompletion?: boolean;
}

export default function AuthGuard({ children, requireProfileCompletion = true }: AuthGuardProps) {
    const {
        isAuthorized,
        isLoading,
        isAuthenticated,
        showProfileModal,
        setShowProfileModal
    } = useAuthProtection({ requireProfileCompletion });

    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // User asked for "popup loggin with googgle"
            // We can't easily open a popup in the exact sense without user interaction triggering it usually,
            // but we can show a Modal that says "Login Required" with a button to "Login with Google".

            // However, implementing that state inside this Effect might be tricky if we want to block the children.
            // Let's render a "Login Required" state if not authenticated.
        }
    }, [isLoading, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Show Login Prompt
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border text-center">
                    <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                    <p className="text-muted-foreground mb-6">
                        You need to be logged in to access this page.
                    </p>
                    <Button onClick={() => signIn('google')} size="lg" className="w-full">
                        Login with Google
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mt-4 w-full"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // If authenticated but profile incomplete (and required)
    // The hook sets showProfileModal to true, but we also blocked isAuthorized.
    // So we should show the modal AND potentially blur/hide content or just show the modal over current content?
    // If it's a "Guard", we usually block access.

    if (!isAuthorized && showProfileModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <ProfileCompletionModal
                    open={true}
                    onOpenChange={() => router.back()}
                />
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Should be handled above, but just in case
    }

    return <>{children}</>;
}
