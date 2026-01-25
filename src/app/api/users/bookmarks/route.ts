import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();
        console.log(`Fetching bookmarks for user: ${userId}`);

        // Ensure Post model is loaded for population
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = Post;

        const user = await User.findById(userId)
            .populate({
                path: 'savedPosts',
                populate: {
                    path: 'author',
                    select: 'name image _id rankTier'
                }
            })
            .select('savedPosts')
            .lean();

        console.log(`Found ${user?.savedPosts?.length || 0} bookmarks`);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ bookmarks: user.savedPosts || [] });
    } catch (error: any) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        );
    }
}
