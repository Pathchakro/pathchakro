import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
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

        const { content, attachments } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Submission content is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const assignment = await Assignment.findById(params.id);

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Check if already submitted
        const existingSubmission = assignment.submissions.find(
            (s: any) => s.student.toString() === session.user.id
        );

        if (existingSubmission) {
            return NextResponse.json(
                { error: 'You have already submitted this assignment' },
                { status: 400 }
            );
        }

        // Check if late
        const isLate = new Date() > assignment.dueDate;

        assignment.submissions.push({
            student: session.user.id,
            submittedAt: new Date(),
            content,
            attachments: attachments || [],
            status: isLate ? 'late' : 'submitted',
        });

        await assignment.save();

        return NextResponse.json({
            message: 'Assignment submitted successfully',
            success: true,
        });
    } catch (error: any) {
        console.error('Error submitting assignment:', error);
        return NextResponse.json(
            { error: 'Failed to submit assignment' },
            { status: 500 }
        );
    }
}
