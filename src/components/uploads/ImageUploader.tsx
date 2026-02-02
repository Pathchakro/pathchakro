'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
    onUpload: (url: string) => void;
    currentImage?: string;
    variant?: 'avatar' | 'cover' | 'post';
    className?: string;
}

export function ImageUploader({
    onUpload,
    currentImage,
    variant = 'avatar',
    className = ''
}: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setError('');

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            onUpload(data.url);
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
            setPreview(currentImage || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getContainerClass = () => {
        switch (variant) {
            case 'avatar':
                return 'h-32 w-32 rounded-full';
            case 'cover':
                return 'h-48 w-full rounded-lg';
            case 'post':
                return 'h-64 w-full rounded-lg';
            default:
                return 'h-32 w-32 rounded-full';
        }
    };

    return (
        <div className="space-y-2">
            <div className={`relative ${getContainerClass()} border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/50 ${className}`}>
                {preview ? (
                    <>
                        <div className="relative w-full h-full">
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized={preview.startsWith('data:')}
                            />
                        </div>
                        {!isUploading && (
                            <button
                                onClick={handleRemove}
                                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground text-center px-2">
                            Click to upload
                        </p>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                />
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            <p className="text-xs text-muted-foreground">
                Max size: 5MB. Formats: JPG, PNG, WebP, GIF
            </p>
        </div>
    );
}
