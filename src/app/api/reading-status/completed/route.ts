import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import User from '@/models/User';
import Book from '@/models/Book';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const _ = Book; // Ensure model registration
        const _u = User;

        const searchParams = request.nextUrl.searchParams;
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        // Default to current month if not provided
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let fromDate = fromParam ? new Date(fromParam) : startOfMonth;
        let toDate = toParam ? new Date(toParam) : endOfMonth;

        // Ensure toDate includes the entire day
        toDate.setHours(23, 59, 59, 999);

        // 1. Find all completed entries in range
        const completedEntries = await UserLibrary.find({
            status: 'completed',
            completedReading: {
                $gte: fromDate,
                $lte: toDate
            }
        })
            .populate({
                path: 'book',
                select: 'title coverImage author slug' // Include slug
            })
            .populate({
                path: 'user',
                select: 'name image email'
            })
            .lean();

        // 2. Group by User manually (easier to handle population than complex aggregate lookups)
        const userMap = new Map();

        completedEntries.forEach((entry: any) => {
            if (!entry.user || !entry.book) return; // Skip if user or book deleted

            const userId = entry.user._id.toString();

            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    user: {
                        _id: entry.user._id,
                        name: entry.user.name,
                        image: entry.user.image,
                        email: entry.user.email
                    },
                    books: [],
                    count: 0
                });
            }

            const userData = userMap.get(userId);
            userData.books.push({
                _id: entry.book._id,
                title: entry.book.title,
                slug: entry.book.slug, // Pass slug
                coverImage: entry.book.coverImage,
                author: entry.book.author,
                completedDate: entry.completedReading
            });
            userData.count += 1;
        });

        // 3. Convert to array and sort
        const leaderboard = Array.from(userMap.values())
            .sort((a: any, b: any) => b.count - a.count);

        return NextResponse.json({
            leaderboard,
            dateRange: {
                from: fromDate,
                to: toDate
            }
        });

    } catch (error: any) {
        console.error('Error fetching completed books leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
