'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function LoginModal({ open, onOpenChange, title, description }: LoginModalProps) {
    const [logoSrc, setLogoSrc] = useState('/logo.png');

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: window.location.href });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Image
                            src={logoSrc}
                            alt="Pathchakro"
                            width={40}
                            height={40}
                            className="bg-transparent"
                            onError={() => {
                                // Fallback if logo not found
                                setLogoSrc('https://www.pathchakro.com/logo.png');
                            }}
                            unoptimized={logoSrc.startsWith('http')}
                        />
                    </div>
                    <DialogTitle className="text-2xl font-bold">{title || 'Login Required'}</DialogTitle>
                    <DialogDescription className="text-center mt-2">
                        {description || 'Please login to continue and access all features of Pathchakro.'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 py-6">
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full flex items-center gap-3 h-12 text-base"
                        onClick={handleGoogleLogin}
                    >
                        <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Continue with Google
                    </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                    By logging in, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
