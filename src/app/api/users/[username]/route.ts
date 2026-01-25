import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Review from '@/models/Review';

import { auth } from '@/auth';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ username: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

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
            query = {
                $or: [
                    { email: params.username.includes('@') ? params.username : undefined },
                    { name: !params.username.includes('@') ? new RegExp(`^${params.username}$`, 'i') : undefined }
                ].filter(Boolean)
            };
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

        return NextResponse.json({
            user,
            stats: {
                posts: postsCount,
                reviews: reviewsCount,
                followers: user.followers?.length || 0,
                following: user.following?.length || 0,
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
