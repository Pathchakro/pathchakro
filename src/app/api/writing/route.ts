import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const onlyMine = searchParams.get('mine') === 'true';

        await dbConnect();

        let filter: any = {};

        if (onlyMine) {
            filter.author = session.user.id;
        } else {
            // Public projects only for browsing
            filter.visibility = 'public';
            filter.status = 'published';
        }

        const projects = await WritingProject.find(filter)
            .populate('author', 'name image rankTier')
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({ projects });
    } catch (error: any) {
        console.error('Error fetching writing projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
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

        const { title, coverImage, introduction, description, category, visibility } = await request.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const project = await WritingProject.create({
            author: session.user.id,
            title,
            coverImage,
            introduction,
            description,
            category: category || [],
            status: 'draft',
            visibility: visibility || 'private',
            chapters: [],
            totalWords: 0,
            totalChapters: 0,
            forSale: false,
        });

        const populatedProject = await WritingProject.findById(project._id)
            .populate('author', 'name image')
            .lean();

        return NextResponse.json(
            { project: populatedProject, message: 'Writing project created successfully' },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating writing project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
}
