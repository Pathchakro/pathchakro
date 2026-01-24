'use client';

import { Star, ThumbsUp, MoreHorizontal, MessageCircle, Share2, Command } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
        };
        user: {
            _id: string;
            name: string;
            image?: string;
            rankTier: string;
        };
        rating: number;
        content: string;
        tags?: string[];
        helpful: number;
        createdAt: string;
    };
}

export function ReviewCard({ review }: ReviewCardProps) {
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
                            <Link href={`/reviews/${review._id}`} className="w-full">View Review</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Body */}
            <div className="flex gap-4 mb-4">
                {/* Book Cover */}
                <div className="w-24 h-32 bg-muted rounded flex-shrink-0 flex items-center justify-center border">
                    {review.book.coverImage ? (
                        <img
                            src={review.book.coverImage}
                            alt={review.book.title}
                            className="w-full h-full object-cover rounded"
                        />
                    ) : (
                        <span className="text-4xl">📚</span>
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="font-bold text-lg">{review.book.title}</h3>
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

                    <p className="text-sm leading-relaxed line-clamp-3">{review.content}</p>

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
