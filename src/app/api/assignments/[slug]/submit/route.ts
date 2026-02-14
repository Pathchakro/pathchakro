import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function POST(
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

        const { content, attachments } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Submission content is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const { slug } = params;
        let assignment;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            assignment = await Assignment.findById(slug);
        }

        if (!assignment) {
            assignment = await Assignment.findOne({ slug });
        }

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Check if late
        const isLate = new Date() > assignment.dueDate;

        // Atomic update: only push if student hasn't submitted yet
        const result = await Assignment.updateOne(
            {
                _id: assignment._id,
                'submissions.student': { $ne: session.user.id }
            },
            {
                $push: {
                    submissions: {
                        student: session.user.id,
                        submittedAt: new Date(),
                        content,
                        attachments: attachments || [],
                        status: isLate ? 'late' : 'submitted',
                    }
                }
            }
        );

        if (result.modifiedCount === 0) {
            // Verify if the assignment still exists to distinguish from duplicate submission
            const stillExists = await Assignment.findById(assignment._id).select('_id');
            if (!stillExists) {
                return NextResponse.json(
                    { error: 'Assignment not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: 'You have already submitted this assignment' },
                { status: 400 }
            );
        }

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
