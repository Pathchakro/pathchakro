import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
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

        const id = params.id;
        const query = (id.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: id }
            : { slug: id };

        const project = await WritingProject.findOne({
            ...query,
            author: session.user.id,
        }).select('-chapters.content'); // Exclude chapter content for list view

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(project);
    } catch (error: any) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
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

        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Chapter title and content are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const id = params.id;
        const query = (id.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: id }
            : { slug: id };

        const project = await WritingProject.findOne({
            ...query,
            author: session.user.id,
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        const chapterNumber = project.chapters.length + 1;

        project.chapters.push({
            chapterNumber,
            title,
            content,
            wordCount,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        project.totalChapters = project.chapters.length;
        project.totalWords = project.chapters.reduce((sum: number, ch: any) => sum + ch.wordCount, 0);

        await project.save();

        return NextResponse.json({
            message: 'Chapter added successfully',
            chapter: project.chapters[project.chapters.length - 1],
        });
    } catch (error: any) {
        console.error('Error adding chapter:', error);
        return NextResponse.json(
            { error: 'Failed to add chapter' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
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

        const { chapterId, title, content, status } = await request.json();

        if (!chapterId) {
            return NextResponse.json(
                { error: 'Chapter ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const id = params.id;
        const query = (id.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: id }
            : { slug: id };

        const project = await WritingProject.findOne({
            ...query,
            author: session.user.id,
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const chapter = project.chapters.id(chapterId);

        if (!chapter) {
            return NextResponse.json(
                { error: 'Chapter not found' },
                { status: 404 }
            );
        }

        if (title) chapter.title = title;
        if (content) {
            chapter.content = content;
            chapter.wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        }
        if (status) chapter.status = status;
        chapter.updatedAt = new Date();

        project.totalWords = project.chapters.reduce((sum: number, ch: any) => sum + ch.wordCount, 0);

        await project.save();

        return NextResponse.json({
            message: 'Chapter updated successfully',
            chapter,
        });
    } catch (error: any) {
        console.error('Error updating chapter:', error);
        return NextResponse.json(
            { error: 'Failed to update chapter' },
            { status: 500 }
        );
    }
}
