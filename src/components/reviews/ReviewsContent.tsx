'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Input } from '@/components/ui/input';
import { Loader2, Search, BookOpen, Star, Heart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Review } from '@/types'; // Assuming Review is exported or I'll define it locally since I can't import IReview easily if it's not exported properly or clashes. I'll stick to local interface if safer.

interface ReviewType {
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
}

interface ReviewsContentProps {
    initialReviews: ReviewType[];
    currentUserId?: string;
    initialSavedReviewIds?: string[];
}

export default function ReviewsContent({
    initialReviews,
    currentUserId,
    initialSavedReviewIds = [],
}: ReviewsContentProps) {
    const [reviews, setReviews] = useState<ReviewType[]>(initialReviews);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [activeTab, setActiveTab] = useState('all');
    const [savedReviewIds, setSavedReviewIds] = useState<Set<string>>(new Set(initialSavedReviewIds));
    const isFirstRender = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchReviews = useCallback(async () => {
        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.set('search', debouncedSearch);

            if (activeTab === 'mine') {
                queryParams.set('filter', 'mine');
            } else if (activeTab === 'favorites') {
                queryParams.set('filter', 'favorites');
            }

            const response = await fetch(`/api/reviews?${queryParams.toString()}`, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Error fetching reviews: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.reviews) {
                setReviews(data.reviews);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Request was aborted, ignore
                return;
            }
            console.error('Error fetching reviews:', error);
        } finally {
            // Only turn off loading if this is the current request (not aborted)
            if (abortControllerRef.current === controller) {
                setLoading(false);
            }
        }
    }, [debouncedSearch, activeTab]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        fetchReviews();
    }, [debouncedSearch, activeTab, fetchReviews]);

    const toggleBookmark = (id: string, isBookmarked: boolean) => {
        const newSet = new Set(savedReviewIds);
        if (isBookmarked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSavedReviewIds(newSet);

        // If we are in favorites tab and remove a bookmark, we can optionally remove it from the list immediately
        // But for UX stability, maybe keeping it until refresh or tab switch is better? 
        // Or we can filter it out immediately. 
        if (activeTab === 'favorites' && !isBookmarked) {
            setReviews(prev => prev.filter(r => r._id !== id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Search and Tabs */}
            <div className="space-y-4 mb-6 sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reviews by book title, tags or content..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            All Reviews
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="flex items-center gap-2" disabled={!currentUserId}>
                            <Star className="h-4 w-4" />
                            My Reviews
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="flex items-center gap-2" disabled={!currentUserId}>
                            <Heart className="h-4 w-4" />
                            <TabsTrigger value="favorites" className="flex items-center gap-2" disabled={!currentUserId}>
                                <Heart className="h-4 w-4" />
                                Favorites
                            </TabsTrigger>                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Reviews Grid/List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review._id}
                            review={review}
                            currentUserId={currentUserId}
                            onDelete={(id) => setReviews(prev => prev.filter(r => r._id !== id))}
                            isBookmarked={savedReviewIds.has(review._id)}
                            onBookmarkChange={toggleBookmark}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <div className="mx-auto w-fit p-3 rounded-full bg-muted/50 mb-4">
                        {activeTab === 'favorites' ? (
                            <Heart className="h-6 w-6 text-muted-foreground" />
                        ) : activeTab === 'mine' ? (
                            <Star className="h-6 w-6 text-muted-foreground" />
                        ) : (
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-foreground">
                        {activeTab === 'favorites'
                            ? "No favorite reviews yet"
                            : activeTab === 'mine'
                                ? "You haven't posted any reviews"
                                : "No reviews found"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeTab === 'favorites'
                            ? "Bookmark reviews you like to see them here."
                            : activeTab === 'mine'
                                ? "Share your thoughts on books you've read."
                                : "Try adjusting your search criteria."}
                    </p>
                </div>
            )}
        </div>
    );
}
