import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { calculateProfileCompletion } from '@/lib/utils';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const skip = (page - 1) * limit;

        const filterParam = searchParams.get('filter');

        const query: any = {};

        if (filterParam === 'mine') {
            const session = await auth();
            if (session?.user?.id) {
                query.author = session.user.id;
            } else {
                return NextResponse.json({
                    posts: [],
                    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
                });
            }
        } else if (filterParam === 'favorites') {
            const session = await auth();
            if (session?.user?.id) {
                // Fetch user to get savedPosts
                const user = await dbConnect().then(() => import('@/models/User').then(m => m.default.findById(session.user.id).select('savedPosts')));
                if (user?.savedPosts && user.savedPosts.length > 0) {
                    query._id = { $in: user.savedPosts };
                } else {
                    return NextResponse.json({
                        posts: [],
                        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
                    });
                }
            } else {
                return NextResponse.json({
                    posts: [],
                    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
                });
            }
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const posts = await Post.find(query)
            .populate('author', 'name image rankTier')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Post.countDocuments(query);

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { content, type, privacy, media, title, category } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        if (!category) {
            return NextResponse.json(
                { error: 'Category is required' },
                { status: 400 }
            );
        }

        if (media && media.length > 5) {
            return NextResponse.json(
                { error: 'Maximum 5 images allowed' },
                { status: 400 }
            );
        }

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findById(session.user.id);
        if (!user || calculateProfileCompletion(user) < 70) {
            return NextResponse.json(
                { error: 'Please complete your profile (70%) to create posts' },
                { status: 403 }
            );
        }

        // Generate slug
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') + '-' + Date.now();

        const post = await Post.create({
            author: session.user.id,
            title,
            slug,
            category,
            content,
            type: type || 'text',
            privacy: 'public', // Force public as requested
            media: media || [],
            likes: [],
            comments: [],
            shares: 0,
        });

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'name image rankTier')
            .lean();

        // Revalidate the entire site cache for posts
        revalidatePath('/', 'layout');

        return NextResponse.json(
            { post: populatedPost },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}
