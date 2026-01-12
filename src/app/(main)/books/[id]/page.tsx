'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ArrowLeft, Video, Download, Upload, ShoppingCart, FileText, Plus, Library } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { YouTubeEmbed } from '@/components/media/YouTubeEmbed';
import { isValidYouTubeUrl } from '@/lib/youtube';
import Link from 'next/link';
import Image from 'next/image';

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
}

interface Review {
    _id: string;
    user: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    rating: number;
    content: string;
    videoUrl?: string;
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
    const params = useParams();
    const bookId = params.id as string;

    const [book, setBook] = useState<Book | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showPDFUpload, setShowPDFUpload] = useState(false);

    // Review form
    const [rating, setRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // PDF upload
    const [pdfFileName, setPdfFileName] = useState('');
    const [pdfFileUrl, setPdfFileUrl] = useState('');
    const [pdfDescription, setPdfDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchBook();
        fetchReviews();
        fetchPDFs();
    }, [bookId]);

    const fetchBook = async () => {
        try {
            const response = await fetch(`/api/books/${bookId}`);
            const data = await response.json();

            if (data.book) {
                setBook(data.book);
            }
        } catch (error) {
            console.error('Error fetching book:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await fetch(`/api/books/${bookId}/reviews`);
            const data = await response.json();

            if (data.reviews) {
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const fetchPDFs = async () => {
        try {
            const response = await fetch(`/api/books/${bookId}/pdfs`);
            const data = await response.json();

            if (data.pdfs) {
                setPdfs(data.pdfs);
            }
        } catch (error) {
            console.error('Error fetching PDFs:', error);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewContent.trim()) {
            alert('Please write a review');
            return;
        }

        if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
            alert('Please enter a valid YouTube URL');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    rating,
                    content: reviewContent,
                    videoUrl: videoUrl || undefined,
                }),
            });

            if (response.ok) {
                alert('Review posted successfully!');
                setReviewContent('');
                setVideoUrl('');
                setRating(5);
                setShowReviewForm(false);
                fetchBook();
                fetchReviews();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUploadPDF = async () => {
        if (!pdfFileName || !pdfFileUrl) {
            alert('Please provide file name and URL');
            return;
        }

        setIsUploading(true);
        try {
            const response = await fetch(`/api/books/${bookId}/pdfs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: pdfFileName,
                    fileUrl: pdfFileUrl,
                    fileSize: 0, // You can calculate this
                    description: pdfDescription,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                setPdfFileName('');
                setPdfFileUrl('');
                setPdfDescription('');
                setShowPDFUpload(false);
                fetchPDFs();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error uploading PDF:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadPDF = async (pdf: PDF) => {
        try {
            await fetch(`/api/books/pdfs/${pdf._id}/download`, { method: 'PUT' });
            window.open(pdf.fileUrl, '_blank');
            fetchPDFs();
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    const handleAddToLibrary = async () => {
        try {
            const response = await fetch('/api/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId }),
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error adding to library:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">Loading book...</div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Book not found</h2>
                    <Link href="/books"><Button>Back to Books</Button></Link>
                </div>
            </div>
        );
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <Link href="/books" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Books
            </Link>

            {/* Book Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="md:col-span-1">
                    <div className="bg-card rounded-lg overflow-hidden border sticky top-4">
                        <div className="relative h-96 bg-muted">
                            {book.coverImage ? (
                                <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-8xl">📚</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 space-y-2">
                            <Button onClick={handleAddToLibrary} className="w-full" variant="outline">
                                <Library className="h-4 w-4 mr-2" />
                                Add to My Library
                            </Button>
                            <Button className="w-full">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Buy This Book
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="bg-card rounded-lg border p-6 mb-4">
                        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                        <p className="text-lg text-muted-foreground mb-4">by {book.author}</p>

                        {book.totalReviews > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-5 w-5 ${star <= Math.round(book.averageRating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="font-semibold">{book.averageRating.toFixed(1)}</span>
                                <span className="text-muted-foreground">({book.totalReviews} reviews)</span>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                            {book.category.map((cat, idx) => (
                                <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                    {cat}
                                </span>
                            ))}
                        </div>

                        {book.description && (
                            <p className="text-muted-foreground mb-4">{book.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {book.publisher && <p><span className="font-medium">Publisher:</span> {book.publisher}</p>}
                            {book.isbn && <p><span className="font-medium">ISBN:</span> {book.isbn}</p>}
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="reviews" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                            <TabsTrigger value="pdfs">PDFs ({pdfs.length})</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>

                        {/* Reviews Tab */}
                        <TabsContent value="reviews" className="space-y-4">
                            <Button onClick={() => setShowReviewForm(!showReviewForm)} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Write a Review
                            </Button>

                            {showReviewForm && (
                                <div className="bg-card border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Write Your Review</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Rating</Label>
                                            <div className="flex gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button" onClick={() => setRating(star)}>
                                                        <Star className={`h-6 w-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Review</Label>
                                            <Textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} rows={4} />
                                        </div>
                                        <div>
                                            <Label>YouTube Video (Optional)</Label>
                                            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleSubmitReview} disabled={isSubmitting} className="flex-1">Submit</Button>
                                            <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reviews.map((review) => (
                                <div key={review._id} className="bg-card border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                                {review.user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{review.user.name}</p>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                                    </div>
                                    <p className="text-sm mb-2">{review.content}</p>
                                    {review.videoUrl && (
                                        <div className="mt-3">
                                            <YouTubeEmbed url={review.videoUrl} title={`${review.user.name}'s review`} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </TabsContent>

                        {/* PDFs Tab */}
                        <TabsContent value="pdfs" className="space-y-4">
                            <Button onClick={() => setShowPDFUpload(!showPDFUpload)} className="w-full">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF
                            </Button>

                            {showPDFUpload && (
                                <div className="bg-card border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Upload PDF</h3>
                                    <div className="space-y-3">
                                        <Input placeholder="File Name" value={pdfFileName} onChange={(e) => setPdfFileName(e.target.value)} />
                                        <Input placeholder="File URL" value={pdfFileUrl} onChange={(e) => setPdfFileUrl(e.target.value)} />
                                        <Textarea placeholder="Description (optional)" value={pdfDescription} onChange={(e) => setPdfDescription(e.target.value)} rows={2} />
                                        <div className="flex gap-2">
                                            <Button onClick={handleUploadPDF} disabled={isUploading} className="flex-1">Upload</Button>
                                            <Button variant="outline" onClick={() => setShowPDFUpload(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pdfs.map((pdf) => (
                                <div key={pdf._id} className="bg-card border rounded-lg p-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-8 w-8 text-red-500" />
                                        <div>
                                            <p className="font-semibold">{pdf.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Uploaded by {pdf.uploadedBy.name} • {formatFileSize(pdf.fileSize)} • {pdf.downloads} downloads
                                            </p>
                                            {pdf.description && <p className="text-sm mt-1">{pdf.description}</p>}
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleDownloadPDF(pdf)}>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details">
                            <div className="bg-card border rounded-lg p-6 space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Book Information</h3>
                                    <dl className="grid grid-cols-2 gap-2 text-sm">
                                        <dt className="font-medium">Title:</dt><dd>{book.title}</dd>
                                        <dt className="font-medium">Author:</dt><dd>{book.author}</dd>
                                        {book.publisher && <><dt className="font-medium">Publisher:</dt><dd>{book.publisher}</dd></>}
                                        {book.isbn && <><dt className="font-medium">ISBN:</dt><dd>{book.isbn}</dd></>}
                                        <dt className="font-medium">Categories:</dt><dd>{book.category.join(', ')}</dd>
                                        <dt className="font-medium">Rating:</dt><dd>{book.averageRating.toFixed(1)} / 5.0</dd>
                                        <dt className="font-medium">Reviews:</dt><dd>{book.totalReviews}</dd>
                                    </dl>
                                </div>
                                {book.description && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Description</h3>
                                        <p className="text-sm text-muted-foreground">{book.description}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
