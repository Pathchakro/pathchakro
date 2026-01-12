import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        await dbConnect();

        const project = await WritingProject.findById(params.id)
            .populate('author', 'name image rankTier')
            .lean();

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Check access permissions
        if (project.visibility === 'private' && project.author._id.toString() !== session?.user?.id) {
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

export async function PUT(
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

        const body = await request.json();

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

        // Update fields
        if (body.title) project.title = body.title;
        if (body.coverImage !== undefined) project.coverImage = body.coverImage;
        if (body.introduction !== undefined) project.introduction = body.introduction;
        if (body.description !== undefined) project.description = body.description;
        if (body.category) project.category = body.category;
        if (body.status) project.status = body.status;
        if (body.visibility) project.visibility = body.visibility;
        if (body.forSale !== undefined) project.forSale = body.forSale;
        if (body.salePrice) project.salePrice = body.salePrice;
        if (body.saleType) project.saleType = body.saleType;

        await project.save();

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
