'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Star, Download, Upload, Library, Edit, PenLine, Heart, Trash2, BookOpen, CheckCircle, Box, MoreVertical } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { BookCover } from './books/BookCover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    addedBy?: {
        _id: string;
        name: string;
        image?: string;
    } | string;
    completedCount?: number;
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
    const [currentStatus, setCurrentStatus] = useState(status);
    const [isLibraryOwned, setIsLibraryOwned] = useState(isOwned);
    const [localCopies, setLocalCopies] = useState(book.copies || 0);
    const [localCompletedCount, setLocalCompletedCount] = useState(book.completedCount || 0);

    useEffect(() => {
        setCurrentStatus(status);
    }, [status]);

    useEffect(() => {
        setIsLibraryOwned(isOwned);
    }, [isOwned]);

    useEffect(() => {
        setLocalCopies(book.copies || 0);
    }, [book.copies]);

    useEffect(() => {
        setLocalCompletedCount(book.completedCount || 0);
    }, [book.completedCount]);

    const handleStatusUpdate = (newStatus: string) => {
        // Optimistic update for completed count
        if (currentStatus === 'completed' && newStatus !== 'completed') {
            setLocalCompletedCount(prev => Math.max(0, prev - 1));
        } else if (currentStatus !== 'completed' && newStatus === 'completed') {
            setLocalCompletedCount(prev => prev + 1);
        }

        setCurrentStatus(newStatus);
        onUpdateStatus(book._id, newStatus);
    };

    const handleToggleLibrary = (action: 'add' | 'remove') => {
        if (action === 'add') {
            setIsLibraryOwned(true);
            setLocalCopies(prev => prev + 1);
            onAddToLibrary(book._id);
        } else {
            setIsLibraryOwned(false);
            setLocalCopies(prev => Math.max(0, prev - 1));
            // Check if onRemoveFromLibrary exists, otherwise it might be handled by parent differently
            if (onRemoveFromLibrary) {
                onRemoveFromLibrary(book._id);
            }
        }
    };

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
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/books/${book._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete book');
            }

            toast.success('Book deleted successfully');
            // Ideally call a parent callback to refresh list, currently just reloading
            window.location.reload();

        } catch (error: any) {
            console.error('Delete failed:', error);
            toast.error(error.message || 'Failed to delete book');
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
            <div className="relative w-full md:w-48 h-64 md:h-auto shrink-0 bg-muted p-4">
                <div className="relative w-full h-full shadow-sm rounded-sm overflow-hidden">
                    <BookCover src={book.coverImage} alt={book.title} />
                </div>
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
                            {/* Rating Display */}
                            <div className="flex items-center gap-1 mt-1">
                                <Star className={`h-4 w-4 ${book.totalReviews > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                                <span className={`font-bold text-sm ${book.totalReviews > 0 ? 'text-yellow-700' : 'text-gray-500'}`}>
                                    {book.averageRating?.toFixed(1) || "0.0"}
                                </span>
                                <span className={`text-xs ${book.totalReviews > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                    ({book.totalReviews})
                                </span>
                            </div>
                        </div>
                        {/* 3-Dot Menu for Owner/Admin */}
                        {(
                            (session?.user && (
                                (book.addedBy && (typeof book.addedBy === 'string' ? book.addedBy === session.user.id : book.addedBy._id === session.user.id)) ||
                                session.user.role === 'admin' ||
                                (session.user as any).role === 'super-admin'
                            ))
                        ) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/books/${book.slug || book._id}/edit`} className="flex w-full items-center cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete();
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
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

                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Box className="h-4 w-4" />
                            <span>Available: {localCopies}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed: {localCompletedCount}</span>
                        </div>
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



                    {/* Library Add/Remove Button with Optimistic UI */}
                    {showRemoveOption || isLibraryOwned ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Remove from Library"
                            onClick={() => handleToggleLibrary('remove')}
                            className="text-primary hover:bg-primary/10"
                        >
                            <Library className="h-5 w-5 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Add to Library"
                            onClick={() => handleToggleLibrary('add')}
                            className="text-gray-500 hover:text-primary"
                        >
                            <Library className="h-5 w-5" />
                        </Button>
                    )}

                    {/* 3-Dot Menu for Owner/Admin */}
                    {(
                        (session?.user && (
                            (book.addedBy && book.addedBy.toString() === session.user.id) ||
                            session.user.role === 'admin' ||
                            (session.user as any).role === 'super-admin'
                        ))
                    ) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>

                                    {/* Delete logic moved to top menu */}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/books/${book.slug || book._id}/edit`} className="flex w-full items-center cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete();
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                    <Link href={`/books/${book.slug || book._id}`}>
                        <Button variant="ghost" size="icon" title="Write Review">
                            <PenLine className="h-5 w-5 text-gray-500 hover:text-primary" />
                        </Button>
                    </Link>

                    <div className="flex items-center ml-auto gap-1 border-l pl-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            title={currentStatus === 'want-to-read' ? "Remove from Wishlist" : "Wish to Read"}
                            onClick={() => handleStatusUpdate(currentStatus === 'want-to-read' ? '' : 'want-to-read')}
                            className={currentStatus === 'want-to-read' ? "text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}
                        >
                            <Heart className={`h-5 w-5 ${currentStatus === 'want-to-read' ? "fill-current" : ""}`} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title={currentStatus === 'reading' ? "Remove from Reading" : "Mark as Reading"}
                            onClick={() => handleStatusUpdate(currentStatus === 'reading' ? '' : 'reading')}
                            className={currentStatus === 'reading' ? "text-blue-500 hover:bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}
                        >
                            <BookOpen className={`h-5 w-5 ${currentStatus === 'reading' ? "fill-current" : ""}`} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title={currentStatus === 'completed' ? "Remove from Completed" : "Mark as Completed"}
                            onClick={() => handleStatusUpdate(currentStatus === 'completed' ? '' : 'completed')}
                            className={currentStatus === 'completed' ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}
                        >
                            <CheckCircle className={`h-5 w-5 ${currentStatus === 'completed' ? "fill-current" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
