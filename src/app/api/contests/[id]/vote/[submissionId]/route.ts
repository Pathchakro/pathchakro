import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string; submissionId: string }> }
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

        await dbConnect();

        const contest = await Contest.findById(params.id);

        if (!contest) {
            return NextResponse.json(
                { error: 'Contest not found' },
                { status: 404 }
            );
        }

        if (contest.status !== 'voting') {
            return NextResponse.json(
                { error: 'Voting is not open for this contest' },
                { status: 400 }
            );
        }

        const submission = contest.submissions.find(
            (s: any) => s._id.toString() === params.submissionId
        );

        if (!submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            );
        }

        // Check if user already voted for this submission
        const hasVoted = submission.voters.some(
            (voterId: any) => voterId.toString() === session.user.id
        );

        if (hasVoted) {
            return NextResponse.json(
                { error: 'You have already voted for this submission' },
                { status: 400 }
            );
        }

        // Add vote
        submission.votes = (submission.votes || 0) + 1;
        submission.voters.push(session.user.id);

        await contest.save();

        return NextResponse.json({
            message: 'Vote recorded successfully',
            success: true,
        });
    } catch (error: any) {
        console.error('Error voting:', error);
        return NextResponse.json(
            { error: 'Failed to vote' },
            { status: 500 }
        );
    }
}
