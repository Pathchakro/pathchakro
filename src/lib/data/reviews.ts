import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book';
import User from '@/models/User';

/**
 * Module-scoped cached function for fetching reviews.
 * Uses primitive arguments to ensure stable cache keys.
 */
const fetchReviews = unstable_cache(
    async (bookId: string, userId: string, limit: number, page: number) => {
        try {
            await dbConnect();
            
            const filter: any = {};
            if (bookId) filter.book = bookId;
            if (userId) filter.user = userId;

            const skip = (page - 1) * limit;

            const reviews = await Review.find(filter)
                .populate('book', 'title author coverImage slug')
                .populate('user', 'name image rankTier')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            return JSON.parse(JSON.stringify(reviews));
        } catch (error) {
            console.error('[REVIEWS_FETCH_ERROR]:', error);
            return [];
        }
    },
    ['reviews-list'],
    {
        tags: ['reviews'],
        revalidate: 3600
    }
);

/**
 * Cache factory for user-specific saved review IDs to handle dynamic tags correctly.
 */
const getSavedReviewCache = (userId: string) => unstable_cache(
    async () => {
        try {
            await dbConnect();
            const user = await User.findById(userId).select('savedReviews').lean();
            if (user && user.savedReviews) {
                return user.savedReviews.map((id: any) => id.toString());
            }
            return [];
        } catch (error) {
            console.error(`Error fetching saved reviews for user ${userId}:`, error);
            return [];
        }
    },
    [`user-saved-reviews-${userId}`],
    {
        tags: [`user-saved-reviews-${userId}`],
        revalidate: 3600
    }
);

/**
 * Fetch reviews with persistent caching.
 * Standardizes the query interface while using persistent caching factories.
 */
export const getCachedReviews = cache(async (query: { bookId?: string; userId?: string; limit?: number; page?: number }) => {
    return fetchReviews(
        query.bookId || '', 
        query.userId || '', 
        query.limit || 10, 
        query.page || 1
    );
});

/**
 * Fetch saved review IDs for a user with persistent caching.
 */
export const getCachedSavedReviewIds = cache(async (userId: string) => {
    const cachedFn = getSavedReviewCache(userId);
    return cachedFn();
});
