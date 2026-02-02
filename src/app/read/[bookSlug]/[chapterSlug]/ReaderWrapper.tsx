"use client";

import { useState, useEffect, useRef } from 'react';
import { ReadingProgressBar } from "./ReadingProgressBar";
import { ReaderContext } from './ReaderContext';

interface ReaderWrapperProps {
    children: React.ReactNode;
}

export function ReaderWrapper({ children }: ReaderWrapperProps) {
    const [mounted, setMounted] = useState(false);

    // Immersive Mode Logic (Keep Only This)
    const [showUI, setShowUI] = useState(true);
    const lastScrollYRef = useRef(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            // Immersive mode is still useful for top/bottom bars on mobile.
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollYRef.current || currentScrollY < 100) {
                setShowUI(true);
            } else if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
                setShowUI(false);
            }
            lastScrollYRef.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!mounted) {
        return (
            <div className="opacity-0">
                {children}
            </div>
        );
    }

    return (
        <ReaderContext.Provider value={{ showUI }}>
            <ReadingProgressBar />
            <div className="min-h-screen bg-background text-foreground">
                {children}
            </div>
        </ReaderContext.Provider>
    );
}
