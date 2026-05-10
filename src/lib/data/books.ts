import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Module-scoped cached function for fetching multiple books
 */
const fetchBooks = unstable_cache(
    async (q: string, category: string, page: number, limit: number) => {
        await dbConnect();
        
        const filter: any = {};
        
        if (q) {
            const safeQ = escapeRegex(q);
            filter.$or = [
                { title: { $regex: safeQ, $options: 'i' } },
                { author: { $regex: safeQ, $options: 'i' } },
            ];
        }
        
        if (category) {
            filter.category = category;
        }

        const safePage = Math.max(1, Number(page) || 1);
        const skip = (safePage - 1) * limit;
        
        const [books, totalBooks] = await Promise.all([
            Book.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(filter)
        ]);

        return {
            books: JSON.parse(JSON.stringify(books)),
            pagination: {
                totalBooks,
                totalPages: Math.ceil(totalBooks / limit),
                currentPage: safePage,
            }
        };
    },
    ['books-list'],
    {
        tags: ['books'],
        revalidate: 3600
    }
);

/**
 * Module-scoped cached function for fetching a single book
 */
const fetchSingleBook = unstable_cache(
    async (slug: string) => {
        await dbConnect();
        const book = await Book.findOne({ slug }).lean();
        return book ? JSON.parse(JSON.stringify(book)) : null;
    },
    ['book-detail'],
    {
        tags: ['books'],
        revalidate: 3600
    }
);

/**
 * Public export for fetching books with caching
 */
export const getCachedBooks = cache(
    async (query: { q?: string; category?: string; page?: number; limit?: number }) => {
        return fetchBooks(
            query.q || '',
            query.category || '',
            query.page || 1,
            query.limit || 20
        );
    }
);

/**
 * Public export for fetching a single book by slug with caching
 */
export const getCachedBookBySlug = cache(
    async (slug: string) => {
        return fetchSingleBook(slug);
    }
);
