import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import User from '@/models/User';
import Book from '@/models/Book'; // Ensure Book model is registered

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Ensure models are registered
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        // 1. Fetch ALL users
        const users = await User.find({})
            .select('name image email rankTie')
            .lean();

        // 2. Fetch library items for status checks
        const libraryItems = await UserLibrary.find({ user: { $in: users.map((u: any) => u._id) } })
            .populate({
                path: 'book',
                select: 'title coverImage author slug'
            })
            .lean();

        // 3. Map status to users based on active reading or range completion
        const report = users.map((user: any) => {
            const userItems = libraryItems.filter((item: any) =>
                item.user.toString() === user._id.toString() && item.book
            );

            // Active books are books currently reading
            const activeBooks = userItems
                .filter((item: any) => item.status === 'reading')
                .map((item: any) => ({
                    _id: item.book._id,
                    title: item.book.title,
                    slug: item.book.slug,
                    coverImage: item.book.coverImage,
                    author: item.book.author
                }));

            // Active in range if currently reading OR completed in range
            const hasCompletedInRange = userItems.some((item: any) => {
                if (item.status !== 'completed' || !item.completedReading) return false;
                const compDate = new Date(item.completedReading);
                if (fromDate && compDate < fromDate) return false;
                if (toDate && compDate > toDate) return false;
                return true;
            });

            const isActive = activeBooks.length > 0 || hasCompletedInRange;

            return {
                user: {
                    _id: user._id,
                    name: user.name,
                    image: user.image,
                    email: user.email
                },
                activeBooks,
                readingCount: activeBooks.length,
                isIdle: !isActive
            };
        });

        // Sort: Active readers first
        report.sort((a, b) => b.readingCount - a.readingCount);

        return NextResponse.json({
            users: report
        });

    } catch (error: any) {
        console.error('Error fetching user reading status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user statistics' },
            { status: 500 }
        );
    }
}
