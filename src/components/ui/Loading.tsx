'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Loading() {
    return (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
            <span className="sr-only">Loading PathChakro...</span>
            <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                    scale: [0.8, 1.1, 0.8],
                    opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="relative h-24 w-24 md:h-32 md:w-32"
            >
                <Image
                    src="/logo.png"
                    alt="PathChakro Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </motion.div>
        </div>
    );
}
