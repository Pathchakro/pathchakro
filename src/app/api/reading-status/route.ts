import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import Book from '@/models/Book';
import Review from '@/models/Review';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const now = new Date();
        // Default to start of current month
        let fromDate = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
        // Default to end of current month
        let toDate = toParam ? new Date(toParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Ensure toDate covers the full day
        toDate.setHours(23, 59, 59, 999);

        // 1. Aggregate stats from UserLibrary
        const stats = await UserLibrary.aggregate([
            {
                $group: {
                    _id: '$book',
                    readingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'reading'] }, 1, 0] }
                    },
                    wantToReadCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'want-to-read'] }, 1, 0] }
                    },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    // Check for completion within selected range
                    monthlyCompletedCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$status', 'completed'] },
                                        { $gte: ['$completedReading', fromDate] },
                                        { $lte: ['$completedReading', toDate] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // 2. Fetch all books
        const books = await Book.find({}).sort({ createdAt: -1 }).lean();

        // 3. Fetch reviews in bulk to mapping
        const allReviews = await Review.find({})
            .populate('user', 'name image username')
            .lean();

        // 4. Fetch all completed libraries with users to identify silent vs vocal readers
        const allCompleted = await UserLibrary.find({ status: 'completed' })
            .populate('user', 'name image username')
            .lean();

        let totalReaders = 0;
        let activeBooks = 0;
        let monthlyCompleted = 0;

        // 5. Merge stats with books
        const report = books.map((book: any) => {
            const bookId = book._id.toString();
            const bookStats = stats.find(s => s._id.toString() === bookId);

            const reading = bookStats ? bookStats.readingCount : 0;
            const wantToRead = bookStats ? bookStats.wantToReadCount : 0;
            const completed = bookStats ? bookStats.completedCount : 0;
            const monthly = bookStats ? bookStats.monthlyCompletedCount : 0;

            const bookReviews = allReviews.filter((r: any) => r.book.toString() === bookId);
            const bookCompletions = allCompleted.filter((l: any) => l.book.toString() === bookId);

            // Vocal readers: Completed AND reviewed
            const reviewerUserIds = new Set(bookReviews.map((r: any) => r.user?._id?.toString()).filter(Boolean));
            const vocalReaders = bookCompletions
                .filter((c: any) => c.user && reviewerUserIds.has(c.user._id.toString()))
                .map((c: any) => c.user);
            
            // Silent readers: Completed but NOT in reviewer list
            const silentReaders = bookCompletions
                .filter((c: any) => c.user && !reviewerUserIds.has(c.user._id.toString()))
                .map((c: any) => c.user);

            // All Reviewers (might include people who haven't "completed" but reviewed?)
            // Usually review implies completion, but we show all.
            const allReviewers = bookReviews.map((r: any) => r.user).filter(Boolean);

            totalReaders += reading;
            if (reading > 0) activeBooks++;
            monthlyCompleted += monthly;

            return {
                _id: book._id,
                title: book.title,
                slug: book.slug,
                author: book.author,
                coverImage: book.coverImage,
                copies: book.copies || 0,
                reading,
                wantToRead,
                completed,
                reviewCount: bookReviews.length,
                silentReaders,
                vocalReaders,
                allReviewers,
            };
        });

        // Calculate summary
        // Note: activeBooks is based on how many books have at least 1 reader right now.
        // totalReaders is sum of all readers.

        return NextResponse.json({
            report,
            summary: {
                totalReaders,
                activeBooks,
                monthlyCompleted
            }
        });
    } catch (error: any) {
        console.error('Error fetching reading status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
