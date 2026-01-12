import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        const comments = await Comment.find({ post: params.id })
            .populate('author', 'name image rankTier')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ comments });
    } catch (error: any) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

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

        const body = await request.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify post exists
        const post = await Post.findById(params.id);
        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Create comment
        const comment = await Comment.create({
            post: params.id,
            author: session.user.id,
            content: content.trim(),
            likes: [],
            replies: [],
        });

        // Add comment to post
        post.comments.push(comment._id);
        await post.save();

        // Populate and return
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'name image rankTier')
            .lean();

        return NextResponse.json(
            { comment: populatedComment },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
}
