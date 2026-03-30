'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageSliderProps {
    images: string[];
    title: string;
    aspectRatio?: string;
    autoSlideInterval?: number;
}

export function ImageSlider({ 
    images, 
    title, 
    aspectRatio = "aspect-[16/9]", 
    autoSlideInterval = 5000 
}: ImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Reset auto-slide whenever currentIndex changes (manual or auto)
    useEffect(() => {
        if (!images || images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, autoSlideInterval);

        return () => clearInterval(interval);
    }, [currentIndex, images.length, autoSlideInterval]);

    // Safety guard for index bounds
    useEffect(() => {
        if (images && images.length > 0 && currentIndex >= images.length) {
            setCurrentIndex(0);
        }
    }, [images, currentIndex]);

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) {
        return (
            <div className={`relative w-full ${aspectRatio} bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center`}>
                <Plane className="h-12 w-12 text-white/30" />
            </div>
        );
    }

    return (
        <div className={`relative w-full ${aspectRatio} bg-muted overflow-hidden group/slider`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative h-full w-full"
                >
                    <Image
                        src={images[currentIndex]}
                        alt={`${title} - image ${currentIndex + 1}`}
                        fill
                        className="object-cover transition-transform group-hover/slider:scale-105"
                        priority={currentIndex === 0}
                    />
                </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity z-10"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        onClick={nextImage}
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity z-10"
                    >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </>
            )}
        </div>
    );
}
