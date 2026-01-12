import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const post = await Post.findById(params.id);

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        const userId = session.user.id;
        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // Unlike
            post.likes = post.likes.filter((id: any) => id.toString() !== userId);
        } else {
            // Like
            post.likes.push(userId);
        }

        await post.save();

        return NextResponse.json({
            liked: !hasLiked,
            likesCount: post.likes.length,
        });
    } catch (error: any) {
        console.error('Error toggling like:', error);
        return NextResponse.json(
            { error: 'Failed to toggle like' },
            { status: 500 }
        );
    }
}
