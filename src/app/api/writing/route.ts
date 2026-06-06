import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';
import User from '@/models/User';
import { generateUniqueSlug } from '@/lib/slug-utils';
import { slugify as createChapterSlug } from '@/lib/utils';
import mongoose from 'mongoose';

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

        // Force User registration to prevent MissingSchemaError
        if (!mongoose.models.User) {
            const _ = User.schema;
        }

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
            .populate('author', 'name image username rankTier')
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
        const { title, coverImage, introduction, description, category, visibility, slug: customSlug } = requestBody;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Force User registration to prevent MissingSchemaError
        if (!mongoose.models.User) {
            const _ = User.schema;
        }

        // Robust customSlug validation and sanitization
        let validatedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile', 'writing', 'projects'].includes(trimmed);
            
            if (trimmed.length >= 3 && trimmed.length <= 100 && isValidPattern && !isReserved) {
                validatedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 3-100 characters, lowercase letters, numbers, and hyphens. No reserved words.' },
                    { status: 400 }
                );
            }
        }

        // Generate unique slug from validated input or title fallback
        const slug = await generateUniqueSlug(WritingProject, validatedSlug || title);

        const initialChapters = [];
        let totalWords = 0;
        let totalChapters = 0;

        // If initial chapter details are provided, create the first chapter
        if (requestBody.chapterName) {
            initialChapters.push({
                chapterNumber: 1,
                title: requestBody.chapterName,
                slug: createChapterSlug(requestBody.chapterName) || 'chapter-1',
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
            description,
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
