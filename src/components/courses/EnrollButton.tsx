'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';

interface EnrollButtonProps {
    slug: string;
}

export function EnrollButton({ slug }: EnrollButtonProps) {
    const { status } = useSession();
    const router = useRouter();
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleEnrollClick = () => {
        if (status === 'loading') return;
        
        if (status === 'unauthenticated') {
            setShowLoginModal(true);
        } else if (status === 'authenticated') {
            router.push(`/courses/${slug}/enroll`);
        }
    };

    return (
        <>
            <Button 
                onClick={handleEnrollClick}
                disabled={status === 'loading'}
                className="w-full text-lg font-semibold h-12 shadow-md hover:shadow-xl transition-all"
            >
                {status === 'loading' ? 'Checking session...' : 'Enroll Now'}
            </Button>
            <LoginModal 
                open={showLoginModal} 
                onOpenChange={setShowLoginModal}
                title="Login to Enroll"
                description="Sign in to enroll in this course and start your learning journey with Pathchakro."
            />
        </>
    );
}
