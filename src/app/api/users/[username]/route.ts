import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Review from '@/models/Review';
import UserLibrary from '@/models/UserLibrary';
import Book from '@/models/Book';

import { auth } from '@/auth';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ username: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();
        const _ = Book; // Ensure model registration

        let query = {};

        if (params.username === 'me') {
            const session = await auth();
            if (!session?.user?.email) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            query = { email: session.user.email };
        } else {
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.username);
            const conditions: any[] = [{ username: params.username.toLowerCase() }];

            if (params.username.includes('@')) {
                conditions.push({ email: params.username });
            }

            if (isObjectId) {
                conditions.push({ _id: params.username });
            }

            query = { $or: conditions };
        }

        const user = await User.findOne(query).select('-password');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get user's posts count
        const postsCount = await Post.countDocuments({ author: user._id });

        // Get user's reviews count
        const reviewsCount = await Review.countDocuments({ user: user._id });

        // Get library stats
        const libraryStats = await UserLibrary.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: null,
                    completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    reading: { $sum: { $cond: [{ $eq: ["$status", "reading"] }, 1, 0] } },
                    wishlist: { $sum: { $cond: [{ $eq: ["$status", "want-to-read"] }, 1, 0] } },
                    totalCount: { $sum: 1 }
                }
            }
        ]);

        const lib = libraryStats[0] || { completed: 0, reading: 0, wishlist: 0, totalCount: 0 };

        return NextResponse.json({
            user,
            stats: {
                posts: postsCount,
                reviews: reviewsCount,
                followers: user.followers?.length || 0,
                following: user.following?.length || 0,
                library: {
                    completed: lib.completed,
                    reading: lib.reading,
                    wishlist: lib.wishlist,
                    total: lib.totalCount
                }
            },
        });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
