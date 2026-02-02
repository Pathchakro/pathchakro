"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const currentProgress = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

            if (scrollHeight) {
                setProgress(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
            }
        };

        window.addEventListener("scroll", updateProgress);
        // Initial call
        updateProgress();

        return () => window.removeEventListener("scroll", updateProgress);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
            <div
                className="h-full bg-primary transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
