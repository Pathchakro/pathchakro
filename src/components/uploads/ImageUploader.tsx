'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
    onUpload: (url: string) => void;
    currentImage?: string;
    variant?: 'avatar' | 'cover' | 'post' | 'book';
    disabled?: boolean;
    className?: string;
}

export function ImageUploader({
    onUpload,
    currentImage,
    variant = 'avatar',
    disabled,
    className = ''
}: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const processFile = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError('');

        // Show local preview immediately
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

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPreview(null);
        onUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getContainerClass = () => {
        switch (variant) {
            case 'avatar':
                return 'h-32 w-32 rounded-full ring-4 ring-purple-500/10 hover:ring-purple-500/30';
            case 'cover':
                return 'aspect-[1200/630] w-full rounded-2xl';
            case 'post':
                return 'h-64 w-full rounded-2xl';
            case 'book':
                return 'h-64 w-44 rounded-xl shadow-md border-2';
            default:
                return 'h-32 w-32 rounded-full';
        }
    };

    return (
        <div className="space-y-3 w-full">
            <div 
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) await processFile(file);
                }}
                className={`group relative ${getContainerClass()} border-2 border-dashed overflow-hidden bg-gradient-to-br from-muted/40 to-muted/80 flex items-center justify-center transition-all duration-300 ${
                    isDragOver 
                        ? 'border-purple-500 bg-purple-500/5 scale-[1.01] shadow-lg shadow-purple-500/5' 
                        : 'border-border/60 hover:border-purple-500/50 hover:bg-muted/80'
                } ${className}`}
            >
                {preview ? (
                    <div className="relative w-full h-full group/image overflow-hidden">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className={`${variant === 'cover' ? 'object-contain bg-muted' : 'object-cover'} transition-transform duration-700 ease-out group-hover/image:scale-[1.04]`}
                            unoptimized={preview.startsWith('data:')}
                        />
                        {/* Gradient shade overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                        
                        {!isUploading && (
                            <button
                                onClick={handleRemove}
                                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md shadow-md hover:shadow-red-500/20 active:scale-95 transition-all duration-200 z-20"
                                title="Remove Image"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer pointer-events-none">
                        <div className="p-3 rounded-2xl bg-background border border-border/40 shadow-sm group-hover:scale-110 group-hover:shadow-md group-hover:border-purple-500/20 transition-all duration-300 mb-3">
                            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-foreground/80 group-hover:text-purple-600 transition-colors">
                            {variant === 'avatar' ? 'Upload Photo' : (variant === 'book' ? 'Upload Book Cover' : 'Upload Cover Image')}
                        </span>
                        <span className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                            Drag & drop or click to browse
                        </span>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10 animate-fade-in">
                        <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-600">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <span className="text-xs font-medium text-purple-600 animate-pulse">Uploading...</span>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={isUploading || disabled}
                />
            </div>

            <div className="flex items-center justify-between px-1">
                {error ? (
                    <span className="text-xs font-medium text-red-500 animate-shake">{error}</span>
                ) : (
                    <span className="text-xs text-muted-foreground/85">
                        Max size 5MB (JPG, PNG, WebP, GIF)
                    </span>
                )}
            </div>
        </div>
    );
}
