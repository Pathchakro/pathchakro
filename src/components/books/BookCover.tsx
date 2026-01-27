'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BookCoverProps {
    src?: string;
    alt: string;
    className?: string; // Allow passing className for custom sizing/containers if needed, though mostly handled by parent
}

export const BookCover = ({ src, alt, className }: BookCoverProps) => {
    const [imgSrc, setImgSrc] = useState(src?.trim() ? src : '/assets/demobook.webp'); const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src?.trim() ? src : '/assets/demobook.webp');
        setHasError(false);
    }, [src]);

    return (
        <Image
            src={hasError ? '/assets/demobook.webp' : imgSrc}
            alt={alt}
            fill
            className={`object-cover ${className || ''}`}
            onError={() => setHasError(true)}
        />
    );
};
