'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookStatusButtons } from '@/components/books/BookStatusButtons';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, Star, ArrowLeft, Download, ShoppingCart, FileText, Plus, Library, MoreVertical, Edit, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';
import { BookCover } from '@/components/books/BookCover';
import { toast } from 'sonner';
import { LoginModal } from '@/components/auth/LoginModal';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Pagination } from '@/components/ui/Pagination';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface Book {
    _id: string;
    title: string;
    author: string;
    description: string;
    coverImage?: string;
    pdfUrl?: string;
    pdfId?: string;
    buyingLink?: string;
    category?: string[];
    averageRating?: number;
    totalReviews?: number;
    addedBy?: string;
    slug: string;
}

interface Review {
    _id: string;
    book: {
        _id: string;
        title: string;
        author: string;
        coverImage?: string;
        slug: string;
    };
    user: {
        _id: string;
        name: string;
        username?: string;
        image?: string;
        rankTier: string;
    };
    rating: number;
    title?: string;
    slug?: string;
    content: string;
    image?: string;
    tags?: string[];
    helpful: number;
    createdAt: string;
}

interface LibraryItem {
    _id: string;
    status: 'want-to-read' | 'reading' | 'completed';
    book: string;
}

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
}

interface BookDetailProps {
    initialBook: Book;
    sessionUser: SessionUser | null;
}

export default function BookDetailClient({ initialBook, sessionUser }: BookDetailProps) {
    const router = useRouter();
    const [book, setBook] = useState<Book>(initialBook);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [libraryItem, setLibraryItem] = useState<LibraryItem | null>(null);

    const fetchReviews = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/reviews?bookId=${id}`);
            if (!response.ok) throw new Error('Failed to load reviews');
            const data = await response.json();
            if (data.reviews) setReviews(data.reviews);
        } catch (error: any) {
            console.error('Reviews error:', error);
            toast.error(error.message || 'Error loading reviews');
        }
    }, []);

    const fetchLibraryStatus = useCallback(async (bookId: string) => {
        try {
            const res = await fetch(`/api/library?bookId=${bookId}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.library && data.library.length > 0) {
                setLibraryItem(data.library[0]);
            }
        } catch (error) {
            console.error('Library status error:', error);
        }
    }, []);

    useEffect(() => {
        if (book?._id) {
            fetchReviews(book._id);
            if (sessionUser?.id) {
                fetchLibraryStatus(book._id);
            }
        }
    }, [book?._id, sessionUser?.id, fetchReviews, fetchLibraryStatus]);

    const handleToggleLibrary = async (action: 'add' | 'remove') => {
        if (!sessionUser) { setShowLoginModal(true); return; }
        try {
            const isAdd = action === 'add';
            const url = isAdd ? '/api/library' : `/api/library?bookId=${encodeURIComponent(book._id)}`;
            const response = await fetch(url, {
                method: isAdd ? 'POST' : 'DELETE',
                headers: isAdd ? { 'Content-Type': 'application/json' } : undefined,
                body: isAdd ? JSON.stringify({ bookId: book._id }) : undefined,
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || (isAdd ? 'Added to library' : 'Removed from library'));
                setLibraryItem(isAdd ? data.library : null);
                router.refresh();
            } else {
                toast.error(data.error || 'Operation failed');
            }
        } catch (error: any) {
            console.error('Library action error:', error);
            toast.error(error.message || 'Failed to update library');
        }
    };

    const handleDownloadPDF = async (fileUrl: string, pdfId?: string) => {
        try {
            // 1. Validate URL
            let url: URL;
            try {
                url = new URL(fileUrl);
            } catch (e) {
                toast.error("Invalid download link");
                return;
            }

            // Only allow http/https origins to prevent data/javascript injection
            if (!['http:', 'https:'].includes(url.protocol)) {
                toast.error("Security error: Invalid download protocol");
                return;
            }

            // 2. Sanitize Filename
            // Remove path separators, control characters, and trim length
            const safeTitle = book.title
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
                .trim()
                .substring(0, 200) || 'book-download';
            
            const filename = `${safeTitle}.pdf`;

            // 3. Track download
            if (pdfId) {
                fetch(`/api/books/pdfs/${pdfId}/download`, { method: 'PUT' }).catch(console.error);
            }
            
            // 4. Trigger download
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = filename;
            document.body.appendChild(a); // Append for better browser support
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Failed to start download");
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Book?',
            text: 'Are you sure you want to delete this book permanently?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });
        if (!result.isConfirmed) return;
        
        try {
            const res = await fetch(`/api/books/${book?._id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Book deleted successfully');
                router.push('/books');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('An error occurred during deletion');
        }
    };

    const handleReviewDelete = (deletedId: string) => {
        setReviews(prev => prev.filter(r => r._id !== deletedId));
    };

    return (
        <div className="max-w-7xl mx-auto p-4 pb-20">
            <Link href="/books" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" /> Back to Books
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="md:col-span-1">
                    <div className="bg-card rounded-3xl overflow-hidden border-2 sticky top-4 shadow-sm">
                        <div className="relative aspect-[2/3] bg-muted/30 flex items-center justify-center p-6">
                            <div className="relative w-full h-full shadow-xl rounded-xl overflow-hidden">
                                <BookCover src={book.coverImage} alt={book.title} objectFit="cover" />
                            </div>
                        </div>
                        <div className="p-6 space-y-4 bg-muted/5">
                            <div className="flex items-center justify-center py-4 border-y -mx-6 px-6">
                                <BookStatusButtons
                                    bookId={book._id}
                                    initialStatus={libraryItem?.status}
                                    onStatusChange={(s: any) => setLibraryItem((p: any) => p ? { ...p, status: s } : null)}
                                    showLoginModal={() => setShowLoginModal(true)}
                                />
                            </div>
                            {book.pdfUrl ? (
                                <Button onClick={() => handleDownloadPDF(book.pdfUrl!, book.pdfId)} className="w-full h-12 rounded-xl font-bold" variant="default">
                                    <Download className="h-4 w-4 mr-2" /> Download PDF
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full h-12 rounded-xl border-dashed font-bold" onClick={() => toast.info("PDF not available for this book")}>
                                    No PDF Available
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="bg-card rounded-[2rem] overflow-hidden border-2 p-8 md:p-12 relative h-full shadow-sm">
                        {(sessionUser?.id === book.addedBy || sessionUser?.role === 'admin') && (
                            <div className="absolute top-8 right-8">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-muted">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[140px]">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/books/${book.slug}/edit`} className="flex items-center gap-2 p-2 cursor-pointer">
                                                <Edit className="h-4 w-4" /> Edit
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive flex items-center gap-2 p-2 cursor-pointer focus:bg-destructive/10" onClick={handleDelete}>
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl font-black mb-4 pr-12 tracking-tight">{book.title}</h1>
                        <p className="text-xl font-medium text-muted-foreground mb-6">by <span className="text-foreground">{book.author}</span></p>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`h-4 w-4 ${s <= (book.averageRating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-200'}`} />
                                ))}
                                <span className="ml-2 font-black text-yellow-700">{book.averageRating?.toFixed(1) || '0.0'}</span>
                            </div>
                            <span className="text-muted-foreground font-bold text-sm bg-muted/50 px-3 py-1 rounded-full">
                                {book.totalReviews || 0} reviews
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-8">
                            {book.category?.map((cat: string, idx: number) => (
                                <span key={idx} className="px-4 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-full text-xs font-black uppercase tracking-wider">
                                    {cat}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="outline" onClick={() => handleToggleLibrary(libraryItem ? 'remove' : 'add')} className={`rounded-2xl h-12 px-6 font-bold gap-2 transition-all ${libraryItem ? "text-purple-600 bg-purple-50 border-purple-200" : ""}`}>
                                <Library className="h-5 w-5" /> {libraryItem ? "In Library" : "Add to Library"}
                            </Button>

                            {book.buyingLink && (
                                <Link href={book.buyingLink} target="_blank">
                                    <Button className="bg-orange-600 hover:bg-orange-700 rounded-2xl h-12 px-8 font-bold shadow-lg shadow-orange-600/20"><ShoppingCart className="h-5 w-5 mr-2" /> Buy This Book</Button>
                                </Link>
                            )}
                        </div>

                        <div className="mt-12 space-y-4">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" /> About this book
                            </h3>
                            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                                {book.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-20">
                <div className="flex items-center justify-between mb-10 border-b-2 pb-6">
                    <h2 className="text-3xl font-black flex items-center gap-3">
                        <Users className="h-8 w-8 text-indigo-500" /> Reviews ({reviews.length})
                    </h2>
                    <Button onClick={() => sessionUser ? setIsReviewDialogOpen(true) : setShowLoginModal(true)} className="rounded-2xl h-12 font-bold gap-2 shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5" /> Write a Review
                    </Button>
                </div>
                {reviews.length > 0 ? (
                    <div className="space-y-8">
                        {reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((review) => (
                            <ReviewCard 
                                key={review._id} 
                                review={review} 
                                currentUserId={sessionUser?.id} 
                                onDelete={handleReviewDelete}
                                hideBook={true}
                            />
                        ))}
                        <div className="flex justify-center pt-8">
                            <Pagination currentPage={currentPage} totalPages={Math.ceil(reviews.length / pageSize)} onPageChange={setCurrentPage} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-muted/20 border-2 border-dashed rounded-[3rem]">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <p className="text-xl font-bold text-muted-foreground max-w-xs mx-auto">No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                )}
            </div>

            <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
            {book && <CreateReviewDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen} initialBook={book} />}
        </div>
    );
}
