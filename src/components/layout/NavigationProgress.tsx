'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // When route changes, start progress bar
        setIsLoading(true);
        setProgress(10);

        // Simulate incremental progress toward 85%
        let current = 10;
        progressTimerRef.current = setInterval(() => {
            current = current + (90 - current) * 0.15;
            if (current > 85) {
                clearInterval(progressTimerRef.current!);
            }
            setProgress(Math.min(current, 85));
        }, 100);

        // Complete the bar after the route settles
        timerRef.current = setTimeout(() => {
            // Stop the interval first so it can't roll the bar back after we set 100
            clearInterval(progressTimerRef.current!);
            setProgress(100);
            // Fade out and reset after the completion animation
            finishTimerRef.current = setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
            }, 300);
        }, 400);

        return () => {
            clearInterval(progressTimerRef.current!);
            clearTimeout(timerRef.current!);
            clearTimeout(finishTimerRef.current!);
        };
    }, [pathname, searchParams]);

    if (!isLoading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 z-[9999] h-[3px] transition-all duration-300 ease-out"
            style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
                boxShadow: '0 0 8px rgba(249, 115, 22, 0.7)',
                opacity: isLoading ? 1 : 0,
                transition: isLoading
                    ? 'width 0.3s ease-out, opacity 0.1s'
                    : 'width 0.3s ease-out, opacity 0.4s 0.1s',
            }}
        />
    );
}
