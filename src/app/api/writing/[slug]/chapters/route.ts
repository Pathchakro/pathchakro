import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';
import { isValidVisibility, isValidStatus, slugify } from '@/lib/utils';

export async function GET(
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

        const slug = params.slug;
        const query = (slug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: slug }
            : { slug: slug };

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

        const { title, content, image, slug: chapterSlug, visibility } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Chapter title and content are required' },
                { status: 400 }
            );
        }

        if (visibility && !isValidVisibility(visibility)) {
            return NextResponse.json(
                { error: 'Invalid visibility. Must be "public" or "private".' },
                { status: 400 }
            );
        }

        await dbConnect();

        const slug = params.slug;
        const query = (slug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: slug }
            : { slug: slug };

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

        // Generate slug if not provided using book slug and chapter title
        let finalSlug = chapterSlug;
        if (!finalSlug) {
            finalSlug = slugify(title);
        }

        // Ensure uniqueness within project chapters
        let baseSlug = finalSlug;
        let counter = 1;
        while (project.chapters.some((ch: any) => ch.slug === finalSlug)) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        project.chapters.push({
            chapterNumber,
            title,
            slug: finalSlug,
            image,
            content,
            wordCount,
            status: 'draft',
            visibility: visibility || 'public',
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

        const { chapterId, title, content, status, image, slug: chapterSlug, visibility } = await request.json();

        if (visibility && !isValidVisibility(visibility)) {
            return NextResponse.json(
                { error: 'Invalid visibility. Must be "public" or "private".' },
                { status: 400 }
            );
        }

        if (status && !isValidStatus(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be "draft" or "published".' },
                { status: 400 }
            );
        }

        if (!chapterId) {
            return NextResponse.json(
                { error: 'Chapter ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const slug = params.slug;
        const query = (slug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: slug }
            : { slug: slug };

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

        if (chapterSlug && chapterSlug !== chapter.slug) {
            const isSlugTaken = project.chapters.some(
                (ch: any) => ch.slug === chapterSlug && ch._id.toString() !== chapterId
            );
            if (isSlugTaken) {
                return NextResponse.json(
                    { error: 'Chapter slug already exists in this project' },
                    { status: 409 }
                );
            }
            chapter.slug = chapterSlug;
        }

        if (image !== undefined) chapter.image = image;
        if (content) {
            chapter.content = content;
            chapter.wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        }
        if (status) chapter.status = status;
        if (visibility) chapter.visibility = visibility;
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

export async function DELETE(
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

        const { chapterId } = await request.json();

        if (!chapterId) {
            return NextResponse.json(
                { error: 'Chapter ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const slug = params.slug;
        const query = (slug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: slug }
            : { slug: slug };

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

        project.chapters.pull({ _id: chapterId });

        // Re-calculate stats
        project.totalChapters = project.chapters.length;
        project.totalWords = project.chapters.reduce((sum: number, ch: any) => sum + ch.wordCount, 0);

        await project.save();

        return NextResponse.json({
            message: 'Chapter deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting chapter:', error);
        return NextResponse.json(
            { error: 'Failed to delete chapter' },
            { status: 500 }
        );
    }
}
