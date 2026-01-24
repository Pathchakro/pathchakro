import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import Book from '@/models/Book';

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

        let totalReaders = 0;
        let activeBooks = 0;
        let monthlyCompleted = 0;

        // 3. Merge stats with books
        const report = books.map((book: any) => {
            const bookStats = stats.find(s => s._id.toString() === book._id.toString());

            const reading = bookStats ? bookStats.readingCount : 0;
            const wantToRead = bookStats ? bookStats.wantToReadCount : 0;
            const completed = bookStats ? bookStats.completedCount : 0;
            const monthly = bookStats ? bookStats.monthlyCompletedCount : 0;

            totalReaders += reading;
            if (reading > 0) activeBooks++;
            monthlyCompleted += monthly;

            return {
                _id: book._id,
                title: book.title,
                slug: book.slug, // Add Slug
                author: book.author,
                coverImage: book.coverImage,
                copies: book.copies || 0, // Availability count
                reading,
                wantToRead,
                completed,
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
