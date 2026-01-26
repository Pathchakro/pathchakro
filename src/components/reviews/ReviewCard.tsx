'use client';

import { Star, ThumbsUp, MoreHorizontal, MessageCircle, Share2, Command, Trash2, Pencil } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PostContent } from '@/components/feed/PostContent';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
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
        tags?: string[];
        helpful: number;
        createdAt: string;
    };
    currentUserId?: string;
    onDelete?: (reviewId: string) => void;
}

export function ReviewCard({ review, currentUserId, onDelete }: ReviewCardProps) {
    const router = useRouter();
    const isOwner = currentUserId === review.user._id;

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
                    window.location.reload();
                }
            } else {
                toast.error('Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Error deleting review');
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border p-4 mb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {review.user.image ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img
                                src={review.user.image}
                                alt={review.user.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                            {review.user.name[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{review.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(review.createdAt)} • Book Review
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Link href={`/reviews/${review.slug || review._id}`} className="w-full">View Review</Link>
                        </DropdownMenuItem>
                        {isOwner && (
                            <>
                                <DropdownMenuItem>
                                    <Link href={`/reviews/${review._id}/edit`} className="w-full flex items-center">
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

            {/* Body */}
            <div className="flex gap-4 mb-4">
                {/* Book Cover */}
                <Link href={`/books/${review.book.slug || review.book._id}`} className="w-24 h-32 bg-muted rounded flex-shrink-0 flex items-center justify-center border hover:opacity-90 transition-opacity">
                    {review.book.coverImage ? (
                        <img
                            src={review.book.coverImage}
                            alt={review.book.title}
                            className="w-full h-full object-cover rounded"
                        />
                    ) : (
                        <span className="text-4xl">📚</span>
                    )}
                </Link>

                <div className="flex-1">
                    <Link href={`/books/${review.book.slug || review.book._id}`} className="hover:underline hover:text-primary transition-colors block w-fit">
                        <h3 className="font-bold text-lg">{review.book.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2">by {review.book.author}</p>

                    {/* Rating */}
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
                        <Link href={`/reviews/${review.slug || review._id}`} className="block">
                            <h4 className="font-bold text-base mb-2 hover:text-primary transition-colors inline-flex items-center gap-1">
                                {review.title}
                                <span className="text-xs font-normal text-muted-foreground hover:underline ml-2">(Read more)</span>
                            </h4>
                        </Link>
                    )}

                    <div className="text-sm leading-relaxed line-clamp-3">
                        <PostContent content={review.content} />
                    </div>

                    {/* Tags */}
                    {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
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
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
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
