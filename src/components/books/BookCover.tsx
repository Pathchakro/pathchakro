'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BookCoverProps {
    src?: string;
    alt?: string;
    className?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
};

export const BookCover = ({ src, alt = "Book cover", className, objectFit }: BookCoverProps) => {
    const [imgSrc, setImgSrc] = useState(src?.trim() ? src : '/assets/demobook.webp');
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src?.trim() ? src : '/assets/demobook.webp');
        setHasError(false);
    }, [src]);

    return (
        <Image
            src={hasError ? '/assets/demobook.webp' : imgSrc}
            alt={alt}
            fill
            className={`${objectFitClasses[objectFit || 'cover']} ${className || ''}`}
            onError={() => setHasError(true)}
        />
    );
};
