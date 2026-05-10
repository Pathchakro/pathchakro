import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { revalidatePath, revalidateTag } from 'next/cache';
import { generateUniqueSlug } from '@/lib/slug-utils';

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
        revalidateTag('feed');

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
        const { title, content, category, privacy, media, slug: newSlug } = body;

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
        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (category !== undefined) post.category = category;
        if (privacy !== undefined) post.privacy = privacy;
        if (media !== undefined) post.media = media;

        // Handle slug update with robust validation
        if (newSlug !== undefined && newSlug !== post.slug) {
            const trimmedSlug = typeof newSlug === 'string' ? newSlug.trim().toLowerCase() : '';

            if (trimmedSlug) {
                // Validation pattern: alphanumeric and hyphens only, no leading/trailing hyphens
                const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmedSlug);
                const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile'].includes(trimmedSlug);

                if (isValidPattern && !isReserved && trimmedSlug.length >= 3 && trimmedSlug.length <= 100) {
                    post.slug = await generateUniqueSlug(Post, trimmedSlug, 'slug', true, post._id.toString());
                } else {
                    return NextResponse.json(
                        { error: 'Invalid custom slug. Use 3-100 characters, lowercase letters, numbers, and hyphens. No reserved words.' },
                        { status: 400 }
                    );
                }
            }
        }

        await post.save();

        revalidatePath('/');
        revalidatePath(`/posts/${params.slug}`);
        if (post.slug !== params.slug) {
            revalidatePath(`/posts/${post.slug}`);
        }
        revalidateTag('feed');

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}
