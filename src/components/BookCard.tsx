'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star, Download, Upload, Library, Edit, PenLine, Heart, Trash2, BookOpen, CheckCircle, Box } from 'lucide-react';

export interface BookItem {
    _id: string;
    title: string;
    slug: string;
    author: string;
    publisher?: string;
    category: string[];
    coverImage?: string;
    averageRating: number;
    totalReviews: number;
    description?: string;
    pdfUrl?: string;
    copies?: number;
}

interface BookCardProps {
    book: BookItem;
    status?: string;
    isOwned?: boolean;
    onUpdateStatus: (bookId: string, status: string) => void;
    onAddToLibrary: (bookId: string) => void;
    onRemoveFromLibrary?: (bookId: string) => void;
    showRemoveOption?: boolean;
}

const BookCover = ({ src, alt }: { src?: string; alt: string }) => {
    const [imgSrc, setImgSrc] = useState(src || '/assets/demobook.webp');
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
            className="object-cover"
            onError={() => setHasError(true)}
        />
    );
};

export function BookCard({
    book,
    status = '',
    isOwned = false,
    onUpdateStatus,
    onAddToLibrary,
    onRemoveFromLibrary,
    showRemoveOption = false
}: BookCardProps) {
    return (
        <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col md:flex-row group w-full">
            {/* Book Cover */}
            <div className="relative w-full md:w-48 h-64 md:h-auto shrink-0 bg-muted">
                <BookCover src={book.coverImage} alt={book.title} />
            </div>

            {/* Book Info */}
            <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-xl font-bold mb-1 text-card-foreground">
                                <Link href={`/books/${book.slug}`} className="hover:underline">
                                    {book.title}
                                </Link>
                            </h3>
                            <p className="text-muted-foreground font-medium">
                                {book.author}
                            </p>
                        </div>
                        {/* Rating Display - Always Show */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${book.totalReviews > 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'}`}>
                            <Star className={`h-4 w-4 ${book.totalReviews > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                            <span className={`font-bold ${book.totalReviews > 0 ? 'text-yellow-700' : 'text-gray-500'}`}>
                                {book.averageRating?.toFixed(1) || "0.0"}
                            </span>
                            <span className={`text-xs ${book.totalReviews > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                ({book.totalReviews})
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Box className="h-4 w-4" />
                        <span>Available: {book.copies || 0}</span>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {book.category.map((cat, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>

                    {book.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm mb-4">
                            {book.description}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t">
                    {book.pdfUrl ? (
                        <Link href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" title="Download PDF">
                                <Download className="h-5 w-5 text-gray-500 hover:text-primary" />
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="ghost" size="icon" title="Upload PDF">
                            <Upload className="h-5 w-5 text-gray-400 hover:text-primary" />
                        </Button>
                    )}

                    {showRemoveOption || isOwned ? (
                        onRemoveFromLibrary && (
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Remove from Library"
                                onClick={() => onRemoveFromLibrary(book._id)}
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        )
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Add to Library"
                            onClick={() => onAddToLibrary(book._id)}
                            className="text-gray-500 hover:text-primary"
                        >
                            <Library className="h-5 w-5" />
                        </Button>
                    )}

                    <Link href={`/books/${book.slug}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit Book">
                            <Edit className="h-5 w-5 text-gray-500 hover:text-primary" />
                        </Button>
                    </Link>

                    <Link href={`/books/${book.slug}`}>
                        <Button variant="ghost" size="icon" title="Write Review">
                            <PenLine className="h-5 w-5 text-gray-500 hover:text-primary" />
                        </Button>
                    </Link>

                    <div className="flex items-center ml-auto gap-1 border-l pl-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            title={status === 'want-to-read' ? "On Wishlist" : "Wish to Read"}
                            onClick={() => onUpdateStatus(book._id, 'want-to-read')}
                            className={status === 'want-to-read' ? "text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}
                        >
                            <Heart className={`h-5 w-5 ${status === 'want-to-read' ? "fill-current" : ""}`} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title={status === 'reading' ? "Currently Reading" : "Mark as Reading"}
                            onClick={() => onUpdateStatus(book._id, 'reading')}
                            className={status === 'reading' ? "text-blue-500 hover:bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}
                        >
                            <BookOpen className={`h-5 w-5 ${status === 'reading' ? "fill-current" : ""}`} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title={status === 'completed' ? "Completed" : "Mark as Completed"}
                            onClick={() => onUpdateStatus(book._id, 'completed')}
                            className={status === 'completed' ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}
                        >
                            <CheckCircle className={`h-5 w-5 ${status === 'completed' ? "fill-current" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
