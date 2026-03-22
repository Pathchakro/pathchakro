import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 md:h-10 md:w-10 flex-shrink-0 transition-transform group-hover:scale-105">
                <Image 
                    src="/logo.png" 
                    alt="PathChakro Logo" 
                    fill 
                    className="object-contain"
                    priority
                />
            </div>
            <span className="text-lg md:text-xl font-bold hidden sm:block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                PathChakro
            </span>
        </Link>
    );
}
