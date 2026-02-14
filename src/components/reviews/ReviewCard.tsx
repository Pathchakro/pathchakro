'use client';

import Image from 'next/image';
import { Star, ThumbsUp, MoreHorizontal, MessageCircle, Share2, Trash2, Pencil, Heart } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { generateHtml } from '@/lib/server-html';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReviewCardProps {
    review: {
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
        slug?: string;
        content: string;
        image?: string;
        tags?: string[];
        helpful: number;
        createdAt: string;
    };
    currentUserId?: string;
    onDelete?: (reviewId: string) => void;
    isDetail?: boolean;
    isBookmarked?: boolean;
    onBookmarkChange?: (id: string, newStatus: boolean) => void;
}

export function ReviewCard({
    review,
    currentUserId,
    onDelete,
    isDetail,
    isBookmarked = false,
    onBookmarkChange
}: ReviewCardProps) {
    const router = useRouter();
    const isOwner = currentUserId === review.user._id;
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

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
            const response = await fetch(`/api/reviews/${review._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Review deleted successfully');
                if (onDelete) {
                    onDelete(review._id);
                } else {
                    router.push('/reviews');
                }
            } else {
                toast.error('Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Error deleting review');
        }
    };

    const handleBookmark = async () => {
        if (!currentUserId) {
            toast.error("Please login to bookmark reviews");
            return;
        }

        if (bookmarkLoading) return;
        setBookmarkLoading(true);

        try {
            const response = await fetch(`/api/reviews/${review._id}/bookmark`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.isBookmarked ? "Review saved to favorites" : "Review removed from favorites");
                if (onBookmarkChange) {
                    onBookmarkChange(review._id, data.isBookmarked);
                }
            } else {
                toast.error("Failed to update bookmark");
            }
        } catch (error) {
            console.error("Error bookmarking review:", error);
            toast.error("Something went wrong");
        } finally {
            setBookmarkLoading(false);
        }
    };

    return (
        <div className={`bg-card rounded-lg shadow-sm border mb-4 ${isDetail ? 'p-6' : 'p-4'}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {review.user?.image ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden relative">
                            <Image
                                src={review.user.image}
                                alt={review.user.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                            {review.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{review.user?.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(review.createdAt)} • Book Review
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Bookmark Button */}
                    {currentUserId && (
                        <button
                            onClick={handleBookmark}
                            disabled={bookmarkLoading}
                            className={`p-2 rounded-full transition-colors ${isBookmarked
                                ? "text-red-500 bg-red-50 hover:bg-red-100"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            title={isBookmarked ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Heart className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                        </button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/reviews/${review.slug || review._id}`} className="w-full">View Review</Link>
                            </DropdownMenuItem>
                            {isOwner && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/reviews/${review.slug || review._id}/edit`} className="w-full flex items-center">
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Review
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Body */}
            <div>
                {isDetail ? (
                    <div className="space-y-6">
                        {/* Detail Layout: Title -> Rating -> Image -> Content -> Book */}
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{review.title}</h1>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                                <span className="text-sm text-muted-foreground ml-1">
                                    {review.rating}/5
                                </span>
                            </div>
                        </div>

                        {review.image && (
                            <div className="rounded-lg overflow-hidden border bg-muted shadow-md">
                                <Image
                                    src={review.image}
                                    alt={review.title || 'Review image'}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="w-full h-auto max-h-[600px] object-contain mx-auto"
                                />
                            </div>
                        )}

                        <div className="text-base leading-relaxed mt-4">
                            <div
                                className="prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full text-[16px]"
                                dangerouslySetInnerHTML={{ __html: generateHtml(review.content) }}
                            />
                        </div>

                        {/* Book Footer Card */}
                        <div className="pt-6 border-t mt-8">
                            <p className="text-sm font-semibold text-muted-foreground mb-3">About this book:</p>
                            <Link
                                href={`/books/${review.book.slug || review.book._id}`}
                                className="flex gap-4 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group max-w-sm"
                            >
                                <div className="w-20 h-28 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center border overflow-hidden shadow-sm">
                                    {review.book.coverImage ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={review.book.coverImage}
                                                alt={review.book.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-3xl">📚</span>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                        {review.book.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">by {review.book.author}</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Feed Layout: Book on left, Title/Rating on right */
                    <div className="flex gap-4">
                        <Link
                            href={`/books/${review.book.slug || review.book._id}`}
                            className="w-24 h-32 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center border hover:opacity-90 transition-opacity overflow-hidden"
                        >
                            {review.book.coverImage ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={review.book.coverImage}
                                        alt={review.book.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <span className="text-4xl">📚</span>
                            )}
                        </Link>

                        <div className="flex-1 flex flex-col justify-center">
                            <Link href={`/books/${review.book.slug || review.book._id}`} className="hover:text-primary transition-colors block w-fit">
                                <h3 className="font-bold text-lg leading-tight">{review.book.title}</h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-2">by {review.book.author}</p>

                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                                <span className="text-sm text-muted-foreground ml-1">
                                    {review.rating}/5
                                </span>
                            </div>

                            {review.title && (
                                <Link href={`/reviews/${review.slug || review._id}`} className="block group mt-1">
                                    <h4 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">
                                        {review.title}
                                    </h4>
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Tags common footer */}
                {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                        {review.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t mt-4">
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <ThumbsUp className="h-5 w-5" />
                        <span className="text-sm font-medium">Helpful ({review.helpful})</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
