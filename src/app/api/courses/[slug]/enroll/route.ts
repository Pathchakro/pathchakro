import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to enroll.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { method, transactionId, mobileNumber, name, phone, email, address } = body;

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

        // Validate payment info for paid courses
        const isPaid = course.fee > 0;
        if (isPaid) {
            if (!method) {
                return NextResponse.json(
                    { error: 'Payment method is required' },
                    { status: 400 }
                );
            }
            if (!transactionId && !mobileNumber) {
                return NextResponse.json(
                    { error: 'Please provide either a Transaction ID or mobile number for payment verification' },
                    { status: 400 }
                );
            }
        }

        // Check if student is already enrolled or has a pending enrollment
        const existingEnrollment = await Enrollment.findOne({
            course: course._id,
            student: session.user.id,
            paymentStatus: { $in: ['pending', 'completed'] }
        });

        if (existingEnrollment) {
            if (existingEnrollment.paymentStatus === 'completed') {
                return NextResponse.json(
                    { error: 'You are already enrolled in this course.' },
                    { status: 400 }
                );
            } else {
                return NextResponse.json(
                    { error: 'You have a pending enrollment application for this course.' },
                    { status: 400 }
                );
            }
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            course: course._id,
            student: session.user.id,
            paymentStatus: isPaid ? 'pending' : 'completed',
            paymentDetails: {
                method: isPaid ? method : 'free',
                transactionId: transactionId || undefined,
                mobileNumber: mobileNumber || undefined,
            },
            amount: course.fee || 0,
            name: name || session.user.name || undefined,
            phone: phone || undefined,
            email: email || session.user.email || undefined,
            address: address || undefined
        });

        // If it's a free course, automatically add them to the course students array
        if (!isPaid) {
            await Course.findByIdAndUpdate(course._id, {
                $addToSet: { students: session.user.id }
            });
        }

        revalidateTag('courses', 'max');
        revalidateTag(`course-${course.slug}`, 'max');
        revalidatePath('/', 'layout');

        return NextResponse.json(
            { 
                success: true, 
                message: isPaid ? 'Enrollment submitted! Waiting for approval.' : 'Enrolled successfully!',
                enrollment 
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Course enrollment error:', error);
        return NextResponse.json(
            { error: 'Failed to enroll in course' },
            { status: 500 }
        );
    }
}
