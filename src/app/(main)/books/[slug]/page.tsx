'use client';

import { useEffect, useState } from 'react';
import { BookStatusButtons } from '@/components/books/BookStatusButtons';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Star, ArrowLeft, Video, Download, Upload, ShoppingCart, FileText, Plus, Library, BookOpen, CheckCircle, Bookmark, Users, Edit, Heart, Loader2, MoreVertical } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { YouTubeEmbed } from '@/components/media/YouTubeEmbed';
import { isValidYouTubeUrl } from '@/lib/youtube';
import Link from 'next/link';
import Image from 'next/image';
import { BookCover } from '@/components/books/BookCover';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { LoginModal } from '@/components/auth/LoginModal';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import LoadingSpinner from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/Pagination';
import Swal from 'sweetalert2';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Book {
    _id: string;
    title: string;
    author: string;
    publisher?: string;
    isbn?: string;
    category: string[];
    coverImage?: string;
    description?: string;
    averageRating: number;
    totalReviews: number;
    addedBy?: string;
    pdfUrl?: string;
    buyingLink?: string;
    stats?: {
        reading: number;
        completed: number;
        wantToRead: number;
        inLibrary: number;
    };
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
        image?: string;
        rankTier: string;
    };
    rating: number;
    title?: string;
    content: string;
    image?: string;
    tags?: string[];
    helpful: number;
    createdAt: string;
}

interface PDF {
    _id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    downloads: number;
    description?: string;
    uploadedBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

export default function BookDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const slug = params.slug as string;

    const [book, setBook] = useState<Book | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [libraryItem, setLibraryItem] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPDFUpload, setShowPDFUpload] = useState(false);

    const [pdfFileName, setPdfFileName] = useState('');
    const [pdfFileUrl, setPdfFileUrl] = useState('');
    const [pdfDescription, setPdfDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchBook();
            setCurrentPage(1);
        }
    }, [slug]);

    useEffect(() => {
        if (book?._id && session?.user?.id) {
            fetchReviews(book._id);
            fetchPDFs(book._id);
            fetchLibraryStatus(book._id);
        } else if (book?._id) {
            fetchReviews(book._id);
            fetchPDFs(book._id);
        }
    }, [book, session]);

    const fetchBook = async () => {
        try {
            const response = await fetch(`/api/books/${slug}`);
            const data = await response.json();
            if (data && data.book) setBook(data.book);
        } catch (error) {
            console.error('Error fetching book:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (id: string) => {
        try {
            const response = await fetch(`/api/reviews?bookId=${id}`);
            const data = await response.json();
            if (data.reviews) setReviews(data.reviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const fetchPDFs = async (id: string) => {
        try {
            const response = await fetch(`/api/books/${id}/pdfs`);
            const data = await response.json();
            if (data.pdfs) setPdfs(data.pdfs);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
        }
    };

    const fetchLibraryStatus = async (bookId: string) => {
        try {
            const res = await fetch(`/api/library?userId=${session?.user?.id}&bookId=${bookId}`);
            const data = await res.json();
            if (data.library && data.library.length > 0) {
                setLibraryItem(data.library[0]);
            } else {
                setLibraryItem(null);
            }
        } catch (error) {
            console.error('Error fetching library status:', error);
        }
    };

    const handleToggleLibrary = async (action: 'add' | 'remove') => {
        if (!session) { setShowLoginModal(true); return; }
        try {
            const response = await fetch('/api/library', {
                method: action === 'add' ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: book?._id }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setLibraryItem(data.library);
                fetchBook();
            } else toast.error(data.error);
        } catch (error) { console.error('Error toggling library:', error); }
    };

    const handleDownloadPDF = async (pdf: any) => {
        try {
            // Only track downloads for PDF documents that have a valid ID (excludes direct book.pdfUrl downloads)
            if (pdf?._id) {
                await fetch(`/api/books/pdfs/${pdf._id}/download`, { method: 'PUT' });
            }
            
            window.open(pdf.fileUrl, '_blank');
            if (book?._id && pdf?._id) fetchPDFs(book._id);
        } catch (error) { 
            console.error('Error downloading PDF:', error); 
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Book?',
            text: "Are you sure you want to delete this book?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--card)',
            color: 'var(--foreground)'
        });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`/api/books/${book?._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete book');
            toast.success('Book deleted successfully');
            window.location.href = '/books';
        } catch (error: any) { toast.error(error.message); }
    };

    if (loading) return <div className="max-w-7xl mx-auto p-4"><LoadingSpinner /></div>;
    if (!book) return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-card rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Book not found</h2>
                <Link href="/books"><Button>Back to Books</Button></Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 pb-20">
            <Link href="/books" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" /> Back to Books
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="md:col-span-1">
                    <div className="bg-card rounded-lg overflow-hidden border sticky top-4 h-full">
                        <div className="relative aspect-[2/3] bg-muted/30 flex items-center justify-center p-4">
                            <div className="relative w-full h-full shadow-md rounded overflow-hidden">
                                <BookCover src={book.coverImage} alt={book.title} objectFit="contain" />
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-center py-2 border-y bg-muted/5 -mx-4 px-4">
                                <BookStatusButtons 
                                    bookId={book._id} 
                                    initialStatus={libraryItem?.status} 
                                    onStatusChange={(newStatus: string) => setLibraryItem((prev: any) => prev ? { ...prev, status: newStatus } : null)}
                                    showLoginModal={() => setShowLoginModal(true)}
                                />
                            </div>
                            <div className="space-y-2">
                                {book.pdfUrl ? (
                                    <Button onClick={() => handleDownloadPDF({ _id: '', fileUrl: book.pdfUrl })} className="w-full h-11" variant="outline"><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
                                ) : (
                                    <div className="relative">
                                        <input type="file" id="pdf-upload-detail" className="hidden" accept="application/pdf" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setIsUploading(true);
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                const res = await fetch('/api/upload/pdf', { method: 'POST', body: formData });
                                                if (!res.ok) throw new Error('Upload server error');
                                                
                                                const data = await res.json();
                                                const patchRes = await fetch(`/api/books/${book._id}`, { 
                                                    method: 'PATCH', 
                                                    headers: { 'Content-Type': 'application/json' }, 
                                                    body: JSON.stringify({ pdfUrl: data.url }) 
                                                });

                                                if (patchRes.ok) {
                                                    setBook({ ...book, pdfUrl: data.url });
                                                    toast.success('PDF uploaded and linked');
                                                } else {
                                                    toast.error('Failed to link PDF to book');
                                                }
                                            } catch (err) { 
                                                console.error('Upload Error:', err);
                                                toast.error('Upload failed'); 
                                            } finally { 
                                                setIsUploading(false); 
                                            }
                                        }} />
                                        <Button onClick={() => document.getElementById('pdf-upload-detail')?.click()} className="w-full h-11 border-dashed" variant="outline" disabled={isUploading}><Upload className="h-4 w-4 mr-2" /> {isUploading ? 'Uploading...' : 'Upload PDF'}</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="bg-card rounded-lg overflow-hidden border p-8 relative h-full min-h-[400px]">
                        {/* Options Button only for admin or creator */}
                        {(session?.user?.id === book.addedBy || session?.user?.role === 'admin') && (
                            <div className="absolute top-4 right-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border bg-background/50 backdrop-blur-sm"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild><Link href={`/books/${slug}/edit`} className="flex items-center"><Edit className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        <h1 className="text-4xl font-bold mb-2 pr-12">{book.title}</h1>
                        <p className="text-xl text-muted-foreground mb-1">by {book.author}</p>
                        
                        {/* Rating below author with percentage fill stars */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} className="relative">
                                        <Star className="h-4 w-4 text-gray-200 fill-current" />
                                        <div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.min(100, Math.max(0, (book.averageRating || 0) * 100 - (s - 1) * 100))}%` }}>
                                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <span className="font-bold text-lg leading-none mt-0.5">{book.averageRating?.toFixed(1) || '0.0'}</span>
                            <span className="text-muted-foreground text-sm leading-none mt-1">({book.totalReviews || 0} reviews)</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {book.category?.map((cat, idx) => <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider">{cat}</span>)}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleToggleLibrary(libraryItem ? 'remove' : 'add')} 
                                    className={`rounded-full px-6 gap-2 h-10 shadow-sm border-2 transition-all duration-200 ${libraryItem ? "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" : "text-muted-foreground hover:bg-accent border-muted/50 hover:text-accent-foreground"}`}
                                >
                                    <Library className={`h-4 w-4 ${libraryItem ? "fill-current" : ""}`} />
                                    {libraryItem ? "In Library" : "Add to Library"}
                                </Button>
                            </div>
                        </div>

                        {/* Buy button in right bottom corner */}
                        {book.buyingLink && (
                            <div className="absolute bottom-6 right-8">
                                <Link href={book.buyingLink} target="_blank">
                                    <Button className="bg-orange-600 hover:bg-orange-700 h-12 px-10 rounded-full shadow-lg hover:shadow-orange-200 transform hover:scale-105 transition-all duration-300 font-bold text-base">
                                        <ShoppingCart className="h-5 w-5 mr-3" /> Buy This Book
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {book.stats && (
                            <div className="flex flex-wrap gap-4 mb-8 border-y py-4 bg-muted/5 -mx-8 px-8">
                                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-500" /><span className="font-semibold">{book.stats.reading}</span><span className="text-muted-foreground text-sm">Reading</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span className="font-semibold">{book.stats.completed}</span><span className="text-muted-foreground text-sm">Completed</span></div>
                                <div className="flex items-center gap-2"><Bookmark className="h-4 w-4 text-amber-500" /><span className="font-semibold">{book.stats.wantToRead}</span><span className="text-muted-foreground text-sm">Wishlisted</span></div>
                                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-500" /><span className="font-semibold">{book.stats.inLibrary}</span><span className="text-muted-foreground text-sm">In Libraries</span></div>
                            </div>
                        )}
                        {book.description && <p className="text-lg leading-relaxed text-muted-foreground mb-8">{book.description}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
                            {book.publisher && <div className="flex justify-between"><span className="text-muted-foreground">Publisher</span><span className="font-medium">{book.publisher}</span></div>}
                            {book.isbn && <div className="flex justify-between"><span className="text-muted-foreground">ISBN</span><span className="font-medium">{book.isbn}</span></div>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <h2 className="text-3xl font-bold">Reviews ({reviews.length})</h2>
                    <Button onClick={() => session ? setIsReviewDialogOpen(true) : setShowLoginModal(true)} className="rounded-full px-6"><Plus className="h-5 w-5 mr-2" /> Write a Review</Button>
                </div>
                {reviews.length > 0 ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            {reviews
                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                .map((review) => (
                                    <ReviewCard key={review._id} review={review} currentUserId={session?.user?.id} isDetail={false} hideBook={false} onDelete={(id) => setReviews(prev => prev.filter(r => r._id !== id))} />
                                ))
                            }
                        </div>
                        {reviews.length > pageSize && (
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={Math.ceil(reviews.length / pageSize)} 
                                onPageChange={setCurrentPage} 
                            />
                        )}
                    </div>
                ) : (
                    <div className="bg-muted/10 rounded-xl p-12 text-center border border-dashed">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">No reviews yet</h3>
                        <Button onClick={() => session ? setIsReviewDialogOpen(true) : setShowLoginModal(true)} variant="outline"><Plus className="h-4 w-4 mr-2" /> Post a Review</Button>
                    </div>
                )}
            </div>

            <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} title="Login Required" />
            {book && <CreateReviewDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen} initialBook={{ _id: book._id, title: book.title, author: book.author, coverImage: book.coverImage }} />}
        </div>
    );
}
