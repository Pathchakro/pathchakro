import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Team from '@/models/Team';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        const posts = await Post.find({ team: params.id })
            .populate('author', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ posts });
    } catch (error: any) {
        console.error('Error fetching team posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team posts' },
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

        await dbConnect();

        // Verify team exists and user is a member
        const team = await Team.findById(params.id);

        if (!team) {
            return NextResponse.json(
                { error: 'Team not found' },
                { status: 404 }
            );
        }

        const isMember = team.members.some(
            (m: any) => m.user.toString() === session.user.id
        );

        if (!isMember) {
            return NextResponse.json(
                { error: 'Only team members can post' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const post = await Post.create({
            author: session.user.id,
            content,
            type: 'text',
            privacy: 'team',
            team: params.id,
            likes: [],
            comments: [],
            shares: 0,
        });

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'name image rankTier')
            .lean();

        return NextResponse.json(
            { post: populatedPost },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating team post:', error);
        return NextResponse.json(
            { error: 'Failed to create team post' },
            { status: 500 }
        );
    }
}
