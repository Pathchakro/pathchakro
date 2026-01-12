'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
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
    addedBy?: string;
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
    const { data: session } = useSession();
    const [isUploading, setIsUploading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(book.pdfUrl);

    useEffect(() => {
        setPdfUrl(book.pdfUrl);
    }, [book.pdfUrl]);

    const handleUploadClick = () => {
        const fileInput = document.getElementById(`pdf-upload-${book._id}`) as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload/pdf', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const error = await uploadRes.json();
                throw new Error(error.error || 'Failed to upload PDF');
            }

            const uploadData = await uploadRes.json();
            const newPdfUrl = uploadData.url;

            // 2. Update Book record
            const updateRes = await fetch(`/api/books/${book._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pdfUrl: newPdfUrl }),
            });

            if (!updateRes.ok) {
                throw new Error('Failed to update book record');
            }

            setPdfUrl(newPdfUrl);
            // Optionally notify parent or refresh, but local state update handles the UI

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload PDF. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/books/${book._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete book');
            }

            alert('Book deleted successfully');
            // Ideally call a parent callback to refresh list, currently just reloading
            window.location.reload();

        } catch (error: any) {
            console.error('Delete failed:', error);
            alert(error.message || 'Failed to delete book');
        }
    };

    return (
        <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col md:flex-row group w-full">
            {/* Hidden File Input for Upload */}
            <input
                type="file"
                id={`pdf-upload-${book._id}`}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
            />

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
                                <Link href={`/books/${book.slug || book._id}`} className="hover:underline">
                                    {book.title}
                                </Link>
                            </h3>
                            {book.author ? (
                                <p className="text-muted-foreground font-medium">
                                    {book.author}
                                </p>
                            ) : (
                                <Link href={`/books/${book.slug || book._id}/edit`}>
                                    <p className="text-primary/80 font-medium hover:underline flex items-center gap-1 cursor-pointer text-sm">
                                        <Edit className="h-3 w-3" /> Add Author
                                    </p>
                                </Link>
                            )}
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
                        {book.category && book.category.length > 0 ? (
                            book.category.map((cat, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium"
                                >
                                    {cat}
                                </span>
                            ))
                        ) : (
                            <Link href={`/books/${book.slug || book._id}/edit`}>
                                <span className="text-xs px-2.5 py-0.5 border border-dashed border-primary/50 text-primary/80 rounded-full font-medium hover:bg-primary/5 cursor-pointer flex items-center gap-1">
                                    <Edit className="h-3 w-3" /> Add Category
                                </span>
                            </Link>
                        )}
                    </div>

                    {book.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm mb-4">
                            {book.description}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t">
                    {pdfUrl ? (
                        <Link href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" title="Download PDF">
                                <Download className="h-5 w-5 text-gray-500 hover:text-primary" />
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            title={isUploading ? "Uploading..." : "Upload PDF"}
                            onClick={handleUploadClick}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Upload className="h-5 w-5 text-gray-400 hover:text-primary" />
                            )}
                        </Button>
                    )}

                    {/* Delete Button - Only for Owner or Admin */}
                    {session?.user && (
                        ((book.addedBy && book.addedBy.toString() === session.user.id) ||
                            session.user.role === 'admin' ||
                            (session.user as any).role === 'super-admin') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Book"
                                onClick={handleDelete}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        )
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

                    <Link href={`/books/${book.slug || book._id}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit Book">
                            <Edit className="h-5 w-5 text-gray-500 hover:text-primary" />
                        </Button>
                    </Link>

                    <Link href={`/books/${book.slug || book._id}`}>
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
