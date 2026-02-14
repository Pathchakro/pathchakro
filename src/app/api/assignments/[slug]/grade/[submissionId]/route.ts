import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ slug: string; submissionId: string }> }
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

        const { grade: rawGrade, feedback } = await request.json();
        const grade = Number(rawGrade);

        if (rawGrade === undefined || rawGrade === null || !Number.isFinite(grade) || grade < 0) {
            return NextResponse.json(
                { error: 'Valid numeric grade is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const { slug } = params;

        let query: any = { teacher: session.user.id };
        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            // If slug is ID, check ID OR slug (to be robust, though ID match is cleaner)
            // But we need to check teacher too. 
            // Logic: Find One where (ID=slug OR Slug=slug) AND Teacher=User
            query.$or = [{ _id: slug }, { slug: slug }];
        } else {
            query.slug = slug;
        }

        const assignment = await Assignment.findOne(query);

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found or unauthorized' },
                { status: 404 }
            );
        }

        if (!Number.isFinite(assignment.maxPoints)) {
            return NextResponse.json(
                { error: 'Assignment configuration error: Missing or invalid maximum points' },
                { status: 400 }
            );
        }

        if (grade > assignment.maxPoints) {
            return NextResponse.json(
                { error: `Grade cannot exceed maximum points (${assignment.maxPoints})` },
                { status: 400 }
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
