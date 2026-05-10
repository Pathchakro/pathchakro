import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import Book from '@/models/Book';

export interface LibraryBook {
    _id: string;
    title: string;
    author: string;
    category: string;
    coverImage?: string;
    averageRating: number;
    totalReviews: number;
    slug: string;
    description?: string;
    copies: number;
}

export interface PopulatedLibraryItem {
    _id: string;
    user: string;
    book: LibraryBook;
    status: string;
    isOwned: boolean;
    addedAt: string;
}

/**
 * Cache configuration for user-specific library data.
 */
const MAX_CACHE_SIZE = Number.parseInt(process.env.LIBRARY_CACHE_MAX_SIZE || '1000', 10);
const CACHE_TTL = Number.parseInt(process.env.LIBRARY_CACHE_TTL || '3600', 10);

const userLibraryCacheMap = new Map<string, Function>();

const getUserLibraryCache = (userId: string) => {
    if (!userLibraryCacheMap.has(userId)) {
        // Enforce bounded cache size (LRU-style eviction)
        if (userLibraryCacheMap.size >= MAX_CACHE_SIZE) {
            const oldestKey = userLibraryCacheMap.keys().next().value;
            if (oldestKey !== undefined) {
                userLibraryCacheMap.delete(oldestKey);
            }
        }

        userLibraryCacheMap.set(userId, unstable_cache(
            async () => {
                try {
                    await dbConnect();
                    const libraryItems = await UserLibrary.find({ user: userId })
                        .populate({
                            path: 'book',
                            // Security: pdfUrl removed to prevent unauthorized access to digital assets
                            select: 'title author category coverImage averageRating totalReviews slug description copies'
                        })
                        .sort({ addedAt: -1 })
                        .lean();

                    const filtered = libraryItems.filter((item: any) => item.book);
                    return JSON.parse(JSON.stringify(filtered));
                } catch (error) {
                    console.error(`Error fetching library for user ${userId}:`, error);
                    return [];
                }
            },
            [`user-library-${userId}`],
            {
                tags: ['library', `library-${userId}`],
                revalidate: CACHE_TTL
            }
        ));
    }
    return userLibraryCacheMap.get(userId)!;
};

/**
 * Module-scoped cached function for global library books.
 */
const fetchGlobalLibraryBooks = unstable_cache(
    async () => {
        try {
            await dbConnect();
            const books = await Book.find({ copies: { $gt: 0 } })
                .select('title author category coverImage averageRating totalReviews slug description copies')
                .sort({ title: 1 })
                .lean();
            return JSON.parse(JSON.stringify(books));
        } catch (error) {
            console.error('Error fetching global library books:', error);
            return [];
        }
    },
    ['library-global-books'],
    {
        tags: ['books'],
        revalidate: CACHE_TTL
    }
);

/**
 * Fetch user library with persistent caching.
 */
export const getCachedUserLibrary = cache(async (userId: string): Promise<PopulatedLibraryItem[]> => {
    const cachedFn = getUserLibraryCache(userId);
    return cachedFn();
});

/**
 * Fetch global books for library comparison with persistent caching.
 */
export const getCachedLibraryGlobalBooks = cache(async (): Promise<LibraryBook[]> => {
    return fetchGlobalLibraryBooks();
});
