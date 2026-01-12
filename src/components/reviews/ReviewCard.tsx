'use client';

import { Star, ThumbsUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
        <div className="bg-card rounded-lg shadow-sm border p-4">
            <div className="flex gap-4">
                {/* Book Cover Placeholder */}
                <div className="w-24 h-32 bg-muted rounded flex-shrink-0 flex items-center justify-center">
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

                {/* Review Content */}
                <div className="flex-1">
                    {/* Book Info */}
                    <h3 className="font-semibold text-lg">{review.book.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {review.book.author}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
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

                    {/* Review Text */}
                    <p className="text-sm mb-3 leading-relaxed">{review.content}</p>

                    {/* Tags */}
                    {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {review.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-muted px-2 py-1 rounded-full"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                {review.user.name[0]}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{review.user.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(review.createdAt)}
                                </p>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" className="gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs">{review.helpful || 0}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
