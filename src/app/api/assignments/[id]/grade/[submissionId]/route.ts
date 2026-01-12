import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; submissionId: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { grade, feedback } = await request.json();

        if (grade === undefined || grade < 0) {
            return NextResponse.json(
                { error: 'Valid grade is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const assignment = await Assignment.findOne({
            _id: params.id,
            teacher: session.user.id, // Only teacher can grade
        });

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found or unauthorized' },
                { status: 404 }
            );
        }

        const submission = assignment.submissions.find(
            (s: any) => s._id.toString() === params.submissionId
        );

        if (!submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            );
        }

        submission.grade = grade;
        submission.feedback = feedback || '';
        submission.status = 'graded';

        await assignment.save();

        return NextResponse.json({
            message: 'Assignment graded successfully',
            success: true,
        });
    } catch (error: any) {
        console.error('Error grading assignment:', error);
        return NextResponse.json(
            { error: 'Failed to grade assignment' },
            { status: 500 }
        );
    }
}
