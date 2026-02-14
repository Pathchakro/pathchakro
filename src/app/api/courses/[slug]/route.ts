import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import slugify from 'slugify';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        // Try finding by slug first, fallback to ID if it looks like an ID
        let course = await Course.findOne({ slug: params.slug })
            .populate('instructor', 'name image rankTier')
            .populate('students', 'name image');

        if (!course && params.slug.match(/^[0-9a-fA-F]{24}$/)) {
            course = await Course.findById(params.slug)
                .populate('instructor', 'name image rankTier')
                .populate('students', 'name image');
        }

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('Fetch Course Error:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Find course to check ownership
        // Try slug first, then ID
        const query = { $or: [{ slug: params.slug }] } as any;
        if (params.slug.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: params.slug });
        }

        const course = await Course.findOne(query);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Check ownership
        if (course.instructor.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await Course.findByIdAndDelete(course._id);

        revalidatePath('/', 'layout');
        revalidateTag('courses', 'default');

        return NextResponse.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete Course Error:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        // Find course to check ownership
        // Try slug first, then ID
        const query = { $or: [{ slug: params.slug }] } as any;
        if (params.slug.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: params.slug });
        }

        const course = await Course.findOne(query);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (course.instructor.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // If title updates, update slug? Maybe optional, user might want stable URLs.
        // For now, let's keep slug stable unless explicitly requested or maybe auto-update if title changes.
        // Let's only update slug if title changes and force it. But typically safe to keep old slug.
        // We will update other fields.

        // Explicitly select allowed fields to prevent mass assignment
        const allowedFields = [
            'title', 'description', 'price',
            'duration', 'level', 'tags',
            'image', 'curriculum',
            'whatYouWillLearn', 'requirements'
        ];

        const updateData: any = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            course._id,
            updateData,
            { new: true }
        );

        revalidatePath('/', 'layout');
        revalidateTag('courses', 'default');

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error('Update Course Error:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}
