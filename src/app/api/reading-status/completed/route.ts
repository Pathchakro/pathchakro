import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import User from '@/models/User';
import Book from '@/models/Book';
import Review from '@/models/Review';

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
                select: 'name image email username'
            })
            .lean();

        // 2. Fetch existing reviews for these user-book pairs for the indicator
        const userBookPairs = completedEntries
            .filter((e: any) => e.user?._id && e.book?._id)
            .map((e: any) => ({ user: e.user._id, book: e.book._id }));

        let reviewsSet = new Set<string>();
        if (userBookPairs.length > 0) {
            const reviewsFound = await Review.find({
                $or: userBookPairs
            }).select('user book').lean();
            
            reviewsFound.forEach(r => {
                reviewsSet.add(`${r.user.toString()}-${r.book.toString()}`);
            });
        }

        // 3. Group by User manually (easier to handle population than complex aggregate lookups)
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
                        email: entry.user.email,
                        username: entry.user.username
                    },
                    books: [],
                    count: 0,
                    latestCompletionDate: null
                });
            }

            const userData = userMap.get(userId);
            userData.books.push({
                _id: entry.book._id,
                title: entry.book.title,
                slug: entry.book.slug, // Pass slug
                coverImage: entry.book.coverImage,
                author: entry.book.author,
                completedDate: entry.completedReading,
                hasReviewed: reviewsSet.has(`${userId}-${entry.book._id.toString()}`)
            });
            userData.count += 1;

            // Track latest completion date across all books for this user
            if (!userData.latestCompletionDate || new Date(entry.completedReading) > new Date(userData.latestCompletionDate)) {
                userData.latestCompletionDate = entry.completedReading;
            }
        });

        // 4. Fetch Idle Users (Users who haven't completed anything in this range)
        const activeIds = Array.from(userMap.keys());
        const idleUserList = await User.find({ _id: { $nin: activeIds } }).select('name image email username').lean();

        // Fetch All-time Library stats for these Idle Users via Aggregation
        const idleIds = idleUserList.map((u: any) => u._id);
        const idleStats = await UserLibrary.aggregate([
            { $match: { user: { $in: idleIds } } },
            {
                $lookup: {
                    from: 'books', // MongoDB collection name for Books
                    localField: 'book',
                    foreignField: '_id',
                    as: 'bookInfo'
                }
            },
            { $unwind: { path: '$bookInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$user',
                    totalCompletedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    totalReadingCount: { $sum: { $cond: [{ $in: ['$status', ['reading', 'in-progress']] }, 1, 0] } },
                    libraryCount: { $sum: 1 },
                    lastCompletedDate: { $max: { $cond: [{ $eq: ['$status', 'completed'] }, '$completedReading', null] } },
                    completedBooks: {
                        $push: {
                            $cond: [
                                { $and: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$bookInfo._id', false] }] },
                                {
                                    _id: '$bookInfo._id',
                                    title: '$bookInfo.title',
                                    coverImage: '$bookInfo.coverImage',
                                    author: '$bookInfo.author',
                                    slug: '$bookInfo.slug'
                                },
                                '$$REMOVE'
                            ]
                        }
                    },
                    readingBooks: {
                        $push: {
                            $cond: [
                                { $and: [{ $in: ['$status', ['reading', 'in-progress']] }, { $ifNull: ['$bookInfo._id', false] }] },
                                {
                                    _id: '$bookInfo._id',
                                    title: '$bookInfo.title',
                                    coverImage: '$bookInfo.coverImage',
                                    author: '$bookInfo.author',
                                    slug: '$bookInfo.slug'
                                },
                                '$$REMOVE'
                            ]
                        }
                    },
                    libraryBooks: {
                        $push: {
                            $cond: [
                                { $ifNull: ['$bookInfo._id', false] },
                                {
                                    _id: '$bookInfo._id',
                                    title: '$bookInfo.title',
                                    coverImage: '$bookInfo.coverImage',
                                    author: '$bookInfo.author',
                                    slug: '$bookInfo.slug'
                                },
                                '$$REMOVE'
                            ]
                        }
                    }
                }
            }
        ]);

        const idleStatsMap = new Map(idleStats.map(s => [s._id.toString(), s]));

        const idleUsers = idleUserList.map((u: any) => {
            const stats = idleStatsMap.get(u._id.toString()) || {
                totalCompletedCount: 0,
                totalReadingCount: 0,
                libraryCount: 0,
                lastCompletedDate: null,
                completedBooks: [],
                readingBooks: [],
                libraryBooks: []
            };

            return {
                ...u,
                totalCompleted: stats.totalCompletedCount,
                totalReading: stats.totalReadingCount,
                libraryCount: stats.libraryCount,
                lastCompletedDate: stats.lastCompletedDate,
                completedBooks: stats.completedBooks,
                readingBooks: stats.readingBooks,
                libraryBooks: stats.libraryBooks
            };
        });

        // 5. Convert to array and sort
        const leaderboard = Array.from(userMap.values())
            .sort((a: any, b: any) => b.count - a.count);

        return NextResponse.json({
            leaderboard,
            idleUsers,
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
