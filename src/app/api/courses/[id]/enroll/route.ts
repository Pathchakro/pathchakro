import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { method, transactionId, mobileNumber, proofUrl } = await req.json();

        await dbConnect();

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Check if already enrolled (or pending)
        const existingEnrollment = await Enrollment.findOne({
            course: id,
            student: session.user.id
        } as any);

        if (existingEnrollment) {
            const msg = existingEnrollment.paymentStatus === 'pending'
                ? 'You already have a pending enrollment request.'
                : 'You are already enrolled in this course.';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            course: id,
            student: session.user.id,
            amount: course.fee,
            paymentStatus: 'pending',
            paymentDetails: {
                method,
                transactionId,
                mobileNumber,
                proofUrl
            }
        } as any);

        return NextResponse.json({ success: true, enrollmentId: enrollment._id });

    } catch (error) {
        console.error('Enrollment Error:', error);
        return NextResponse.json({ error: 'Failed to submit enrollment' }, { status: 500 });
    }
}
