import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';

export async function POST(
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

        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const contest = await Contest.findById(params.id);

        if (!contest) {
            return NextResponse.json(
                { error: 'Contest not found' },
                { status: 404 }
            );
        }

        if (contest.status !== 'active') {
            return NextResponse.json(
                { error: 'Contest is not accepting submissions' },
                { status: 400 }
            );
        }

        // Check if user already submitted
        const existingSubmission = contest.submissions.find(
            (s: any) => s.user.toString() === session.user.id
        );

        if (existingSubmission) {
            return NextResponse.json(
                { error: 'You have already submitted to this contest' },
                { status: 400 }
            );
        }

        // Calculate word count
        const wordCount = content.trim().split(/\s+/).length;

        contest.submissions.push({
            user: session.user.id,
            title,
            content,
            wordCount,
            submittedAt: new Date(),
            votes: 0,
            voters: [],
        });

        await contest.save();

        return NextResponse.json({
            message: 'Submission successful',
            success: true,
        });
    } catch (error: any) {
        console.error('Error submitting to contest:', error);
        return NextResponse.json(
            { error: 'Failed to submit' },
            { status: 500 }
        );
    }
}
