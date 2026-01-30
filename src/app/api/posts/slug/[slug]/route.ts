import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { revalidatePath } from 'next/cache';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const post = await Post.findOne({ slug: params.slug }).populate('author', 'name image rankTier');

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ post });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Try to find by slug first
        let post = await Post.findOne({ slug: params.slug });

        // If not found by slug, and params.slug looks like an ObjectId, try finding by ID
        if (!post && params.slug.match(/^[0-9a-fA-F]{24}$/)) {
            post = await Post.findById(params.slug);
        }

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.author.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Post.findByIdAndDelete(post._id);

        revalidatePath('/');
        revalidatePath(`/posts/${params.slug}`);
        revalidatePath('/api/feed');

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, category, privacy, media } = body;

        await dbConnect();

        // Try to find by slug first
        let post = await Post.findOne({ slug: params.slug });

        // If not found by slug, and params.slug looks like an ObjectId, try finding by ID
        if (!post && params.slug.match(/^[0-9a-fA-F]{24}$/)) {
            post = await Post.findById(params.slug);
        }

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.author.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update fields
        if (title) post.title = title;
        if (content) post.content = content;
        if (category) post.category = category;
        if (privacy) post.privacy = privacy;
        if (media) post.media = media;

        // If title changed, maybe regenerate slug? 
        // For simplicity, let's NOT regenerate slug to keep URLs stable unless explicitly requested.
        // User asked for "edit" functionality, typically implies content. 

        await post.save();

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}
