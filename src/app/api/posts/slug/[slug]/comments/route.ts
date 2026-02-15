import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Notification from '@/models/Notification';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const post = await Post.findOne({ slug: params.slug });
        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        const comments = await Comment.find({ post: post._id, parent: null })
            .populate('author', 'name image rankTier')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'name image rankTier'
                }
            })
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
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
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

        // Verify post exists by slug
        const post = await Post.findOne({ slug: params.slug });
        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Create comment object
        const commentData: any = {
            post: post._id,
            author: session.user.id,
            content: content.trim(),
            likes: [],
            replies: [],
        };

        // Handle reply logic
        const { parentId } = body;
        let parentComment: any = null;

        if (parentId) {
            // Check if user is the post author
            const isPostAuthor = post.author.toString() === session.user.id;

            if (!isPostAuthor) {
                return NextResponse.json(
                    { error: 'Only the post author can reply to comments' },
                    { status: 403 }
                );
            }

            // Verify parent comment exists
            parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                return NextResponse.json(
                    { error: 'Parent comment not found' },
                    { status: 404 }
                );
            }

            commentData.parent = parentId;
        }

        const comment = await Comment.create(commentData);

        if (parentId) {
            // Add reply to parent comment
            await Comment.findByIdAndUpdate(parentId, {
                $push: { replies: comment._id }
            });
        } else {
            // Add comment to post
            post.comments.push(comment._id);
            await post.save();
        }

        // Create notification
        if (parentId) {
            // Reply notification: Notify the user who made the parent comment
            // We use the previously fetched parentComment
            if (parentComment && parentComment.author.toString() !== session.user.id) {
                await Notification.create({
                    recipient: parentComment.author,
                    sender: session.user.id,
                    type: 'reply',
                    post: post._id,
                    comment: comment._id,
                    message: `replied to your comment on "${post.title}"`,
                });
            }
        } else {
            // Comment notification: Notify post author
            if (post.author.toString() !== session.user.id) {
                await Notification.create({
                    recipient: post.author,
                    sender: session.user.id,
                    type: 'comment',
                    post: post._id,
                    comment: comment._id,
                    message: `commented on your post "${post.title}"`,
                });
            }
        }

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
