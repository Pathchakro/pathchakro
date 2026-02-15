import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';

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

        await dbConnect();

        // Find post by slug to get its _id
        // We check both slug and _id in case slug is actually an ID (legacy support/fallback)
        let post = await Post.findOne({ slug: params.slug });
        if (!post) {
            if (params.slug.match(/^[0-9a-fA-F]{24}$/)) {
                post = await Post.findById(params.slug);
            }
        }

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        const userId = session.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize savedPosts if undefined
        if (!user.savedPosts) {
            user.savedPosts = [];
        }

        const postIdStr = post._id.toString();
        // Check if already bookmarked
        const isBookmarked = user.savedPosts && user.savedPosts.some((id: any) => {
            const storedId = id && id._id ? id._id.toString() : id.toString();
            return storedId === postIdStr;
        });

        if (isBookmarked) {
            // Remove
            console.log(`Removing bookmark for user ${user._id} post ${post._id}`);
            user.savedPosts = (user.savedPosts as any[]).filter((id: any) => id.toString() !== postIdStr);
        } else {
            // Add
            console.log(`Adding bookmark for user ${user._id} post ${post._id}`);
            (user.savedPosts as any[]).push(post._id);
        }

        await user.save();
        console.log('User saved with bookmarks:', user.savedPosts.length);

        // Revalidate cache
        revalidateTag(`bookmarks-${userId}`, 'default');
        revalidatePath('/', 'layout');

        return NextResponse.json({
            bookmarked: !isBookmarked,
        });
    } catch (error: any) {
        console.error('Error toggling bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to toggle bookmark' },
            { status: 500 }
        );
    }
}
