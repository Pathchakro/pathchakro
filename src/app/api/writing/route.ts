import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';
import slugify from 'slugify';

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
        const authorId = searchParams.get('author');
        const onlyMine = searchParams.get('mine') === 'true';

        await dbConnect();

        let filter: any = {};

        if (onlyMine) {
            filter.author = session.user.id;
        } else if (authorId) {
            filter.author = authorId;
            // If fetching another user's projects, show only public & published
            if (authorId !== session.user.id) {
                filter.visibility = 'public';
                filter.status = 'published';
            }
        } else {
            // Public projects only for browsing (general feed)
            filter.visibility = 'public';
            filter.status = 'published';
        }

        const projects = await WritingProject.find(filter)
            .populate('author', 'name image rankTier')
            .sort({ updatedAt: -1 })
            .lean();

        const responsePayload: any = { projects };

        if (process.env.NODE_ENV === 'development') {
            responsePayload.debug = {
                filter,
                authorParam: authorId,
                sessionUser: session?.user?.id,
                isMatch: authorId === session?.user?.id
            };
        }

        return NextResponse.json(responsePayload);
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

        const requestBody = await request.json();
        const { title, coverImage, introduction, description, category, visibility } = requestBody;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Generate generic slug
        let initialSlug = slugify(title, { lower: true, strict: true });

        // Use title as fallback for non-ASCII (e.g. Bengali), replacing spaces
        if (!initialSlug || initialSlug.length === 0) {
            initialSlug = title.trim().toLowerCase().replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');
        }

        // Final fallback
        if (!initialSlug || initialSlug.length === 0) {
            initialSlug = `untitled-${Date.now()}`;
        }

        let slug = initialSlug;

        // Ensure uniqueness
        let slugExists = await WritingProject.findOne({ slug });
        let counter = 1;
        while (slugExists) {
            slug = `${initialSlug}-${counter}`;
            slugExists = await WritingProject.findOne({ slug });
            counter++;
        }

        const initialChapters = [];
        let totalWords = 0;
        let totalChapters = 0;

        // If initial chapter details are provided, create the first chapter
        if (requestBody.chapterName) {
            // Create initial chapter placeholder; content added via chapter editing later
            initialChapters.push({
                chapterNumber: 1,
                title: requestBody.chapterName,
                content: '',
                wordCount: 0,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            totalChapters = 1;
        }
        const project = await WritingProject.create({
            author: session.user.id,
            title,
            slug,
            coverImage,
            introduction,
            description, // This remains book description
            category: category || [],
            status: 'draft',
            visibility: visibility || 'private',
            chapters: initialChapters,
            totalWords: totalWords,
            totalChapters: totalChapters,
            forSale: false,
        });

        const populatedProject = await WritingProject.findById(project._id)
            .populate('author', 'name image')
            .lean();

        revalidatePath('/', 'layout');

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
