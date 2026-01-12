import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';

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

        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Chapter title and content are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const project = await WritingProject.findOne({
            _id: params.id,
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
    { params }: { params: { id: string; chapterId: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, content, status } = await request.json();

        await dbConnect();

        const project = await WritingProject.findOne({
            _id: params.id,
            author: session.user.id,
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const chapter = project.chapters.id(params.chapterId);

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
