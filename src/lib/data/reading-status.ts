import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import Book from '@/models/Book';
import Review from '@/models/Review';

import User from '@/models/User';

/**
 * Persistent data fetching function wrapped in unstable_cache
 */
const getReadingStatusData = (from: string, to: string) => unstable_cache(
    async () => {
        await dbConnect();
        
        const fromDate = new Date(from);
        const toDate = new Date(to);

        // Validation: Ensure dates are valid and range is logical
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
            throw new Error('Invalid date range provided for reading status report');
        }

        // Use targeted aggregation for efficiency
        const [books, libraryItems, reviews] = await Promise.all([
            Book.aggregate([
                { $project: { title: 1, author: 1, coverImage: 1, slug: 1, copies: 1 } }
            ]),
            UserLibrary.find()
                .select('book status completedReading user isOwned')
                .populate('user', 'name image username')
                .lean(),
            Review.aggregate([
                { $project: { book: 1, user: 1 } }
            ])
        ]);

        // O(n) optimization: Group by book ID using Maps
        const itemsByBook = new Map<string, any[]>();
        const reviewsByBook = new Map<string, any[]>();

        libraryItems.forEach((item: any) => {
            const bookId = item.book?.toString();
            if (bookId) {
                if (!itemsByBook.has(bookId)) itemsByBook.set(bookId, []);
                itemsByBook.get(bookId)!.push(item);
            }
        });

        reviews.forEach((review: any) => {
            const bookId = review.book?.toString();
            if (bookId) {
                if (!reviewsByBook.has(bookId)) reviewsByBook.set(bookId, []);
                reviewsByBook.get(bookId)!.push(review);
            }
        });

        const report = books.map((book: any) => {
            const bookId = book._id.toString();
            const bookLibrary = itemsByBook.get(bookId) || [];
            const bookReviews = reviewsByBook.get(bookId) || [];
            
            const reading = bookLibrary.filter((i: any) => i.status === 'reading');
            const completed = bookLibrary.filter((i: any) => i.status === 'completed');
            const wantToRead = bookLibrary.filter((i: any) => i.status === 'want-to-read');
            const owners = bookLibrary.filter((i: any) => i.isOwned === true);
            
            // Fixed: Use completedReading for range filter
            const rangeCompleted = completed.filter((i: any) => {
                const compDate = i.completedReading ? new Date(i.completedReading) : null;
                return compDate && compDate >= fromDate && compDate <= toDate;
            });

            const reviewerIds = new Set(bookReviews.map((r: any) => (r.user?._id || r.user).toString()));
            const vocalCompletedCount = completed.filter((i: any) => {
                const userId = (i.user?._id || i.user)?.toString();
                return userId && reviewerIds.has(userId);
            }).length;

            const vocalReaders = reviewerIds.size;
            const silentReaders = Math.max(0, completed.length - vocalCompletedCount);

            return {
                _id: bookId,
                title: book.title,
                author: book.author,
                coverImage: book.coverImage,
                slug: book.slug,
                copies: book.copies || 0,
                stats: {
                    reading: reading.length,
                    completed: completed.length,
                    wantToRead: wantToRead.length,
                    rangeCompleted: rangeCompleted.length,
                    vocalReaders,
                    silentReaders,
                    totalInteractions: bookLibrary.length + bookReviews.length
                },
                readingUsers: reading.map((i: any) => i.user).filter(Boolean),
                completedUsers: completed.map((i: any) => i.user).filter(Boolean),
                owners: owners.map((i: any) => i.user).filter(Boolean)
            };
        });

        // Filter and count total unique readers within the date range or currently reading
        const activeReaderIds = new Set<string>();
        libraryItems.forEach((i: any) => {
            const userId = (i.user?._id || i.user)?.toString();
            if (userId) {
                const isReading = i.status === 'reading';
                const compDate = i.completedReading ? new Date(i.completedReading) : null;
                const isCompletedInRange = i.status === 'completed' && compDate && compDate >= fromDate && compDate <= toDate;
                if (isReading || isCompletedInRange) {
                    activeReaderIds.add(userId);
                }
            }
        });
        const totalReaders = activeReaderIds.size;

        const summary = {
            totalBooks: books.length,
            totalReaders,
            totalReviews: reviews.length,
            activeReading: libraryItems.filter((i: any) => i.status === 'reading').length,
            totalCompleted: libraryItems.filter((i: any) => i.status === 'completed').length,
            rangeCompleted: libraryItems.filter((i: any) => {
                const compDate = i.completedReading ? new Date(i.completedReading) : null;
                return i.status === 'completed' && compDate && compDate >= fromDate && compDate <= toDate;
            }).length
        };

        return JSON.parse(JSON.stringify({ report, summary }));
    },
    ['reading-status-report', from, to],
    { tags: ['library', 'reviews', 'books'], revalidate: 3600 }
)();

/**
 * Public function with per-request cache memoization
 */
export const getCachedReadingStatusReport = cache(
    async (query: { from: string; to: string }) => {
        return getReadingStatusData(query.from, query.to);
    }
);
