import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import { revalidateTag, revalidatePath } from 'next/cache';

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

        // Check if user is admin
        const isAdmin = session.user.role === 'admin' || session.user.role === 'super-admin';
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can manage course roster' },
                { status: 403 }
            );
        }

        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find course by slug or ID
        const query = /^[0-9a-fA-F]{24}$/.test(params.slug)
            ? { _id: params.slug }
            : { slug: params.slug };

        const course = await Course.findOne(query);

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // Remove student from course array
        await Course.findByIdAndUpdate(course._id, {
            $pull: { students: studentId }
        });

        // Also delete enrollment or update its status to rejected
        await Enrollment.deleteMany({
            course: course._id,
            student: studentId
        } as any);

        // Invalidate Next.js cache
        revalidateTag('courses', 'max')
        revalidateTag(`course-${course.slug}`, 'max');
        revalidateTag(`course-${course._id}`, 'max');
        revalidatePath('/', 'layout');

        return NextResponse.json({
            message: 'Student removed from course successfully',
            success: true,
        });
    } catch (error: any) {
        console.error('Error removing student from course:', error);
        return NextResponse.json(
            { error: 'Failed to remove student from course' },
            { status: 500 }
        );
    }
}
