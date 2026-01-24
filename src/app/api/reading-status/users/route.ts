import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import User from '@/models/User';
import Book from '@/models/Book'; // Ensure Book model is registered

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Ensure models are registered
        // (Sometimes needed in dev environment if models aren't imported yet)
        const _ = Book;

        // 1. Fetch ALL users (just basic info)
        const users = await User.find({})
            .select('name image email rankTie')
            .lean();

        // 2. Fetch ALL "reading" status items
        const activeReadings = await UserLibrary.find({ status: 'reading' })
            .populate({
                path: 'book',
                select: 'title coverImage author slug' // Include slug
            })
            .lean();

        // 3. Map readings to users
        const report = users.map((user: any) => {
            // Find all books this user is reading
            const userReadings = activeReadings.filter((item: any) =>
                item.user.toString() === user._id.toString() && item.book // Check item.book exists
            );

            const activeBooks = userReadings.map((item: any) => ({
                _id: item.book._id,
                title: item.book.title,
                slug: item.book.slug, // Pass slug
                coverImage: item.book.coverImage,
                author: item.book.author
            }));

            return {
                user: {
                    _id: user._id,
                    name: user.name,
                    image: user.image,
                    email: user.email // Optional, maybe for admin view? Keeping for unique ID
                },
                activeBooks,
                readingCount: activeBooks.length,
                isIdle: activeBooks.length === 0
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
