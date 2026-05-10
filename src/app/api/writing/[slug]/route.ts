import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        await dbConnect();

        const slug = params.slug;
        const query = (slug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: slug }
            : { slug: slug };

        const project = await WritingProject.findOne(query)
            .populate('author', 'name image rankTier')
            .lean();

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Check access permissions
        const authorId = (project.author as any)?._id?.toString() || project.author?.toString();
        if (project.visibility === 'private' && authorId !== session?.user?.id) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json({ project });
    } catch (error: any) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
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

        await dbConnect();

        const slug = params.slug;
        const query = (slug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: slug }
            : { slug: slug };

        const result = await WritingProject.deleteOne({
            ...query,
            author: session.user.id,
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Project not found or unauthorized' },
                { status: 404 }
            );
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
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

        const body = await request.json();

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

        // Update fields with presence checks
        if (body.title !== undefined) project.title = body.title;
        if (body.coverImage !== undefined) project.coverImage = body.coverImage;
        if (body.introduction !== undefined) project.introduction = body.introduction;
        if (body.description !== undefined) project.description = body.description;
        if (body.category !== undefined) project.category = body.category;
        if (body.status !== undefined) project.status = body.status;
        if (body.visibility !== undefined) {
            project.visibility = body.visibility;
            // Sync all chapters to have the same visibility
            if (project.chapters && project.chapters.length > 0) {
                project.chapters.forEach((chapter: any) => {
                    chapter.visibility = body.visibility;
                });
            }
        }
        if (body.forSale !== undefined) project.forSale = body.forSale;
        if (body.salePrice !== undefined) project.salePrice = body.salePrice;
        if (body.saleType !== undefined) project.saleType = body.saleType;

        // Handle slug update with robust validation and sanitization
        if (body.slug !== undefined && body.slug !== project.slug) {
            if (typeof body.slug !== 'string') {
                return NextResponse.json(
                    { error: 'Slug must be a string' },
                    { status: 400 }
                );
            }

            const trimmedSlug = body.slug.trim().toLowerCase();
            
            if (trimmedSlug) {
                // Validation pattern: alphanumeric and hyphens only, no leading/trailing hyphens
                const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmedSlug);
                const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile', 'writing'].includes(trimmedSlug);
                
                if (isValidPattern && !isReserved && trimmedSlug.length >= 3 && trimmedSlug.length <= 100) {
                    project.slug = await generateUniqueSlug(WritingProject, trimmedSlug, 'slug', true, project._id.toString());
                } else {
                    return NextResponse.json(
                        { error: 'Invalid custom slug. Use 3-100 characters, lowercase letters, numbers, and hyphens.' },
                        { status: 400 }
                    );
                }
            }
        }

        await project.save();

        revalidatePath('/', 'layout');

        return NextResponse.json({
            project,
            message: 'Project updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        );
    }
}
