import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';
import { Types } from 'mongoose';

export async function POST(
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


        if (!Types.ObjectId.isValid(params.submissionId)) {
            return NextResponse.json(
                { error: 'Invalid submission ID' },
                { status: 400 }
            );
        }
        const submissionObjectId = new Types.ObjectId(params.submissionId);

        await dbConnect();

        const userId = session.user.id;
        const contestPath = /^[0-9a-fA-F]{24}$/.test(params.slug)
            ? { _id: params.slug }
            : { slug: params.slug };

        // Attempt Atomic Update:
        // Match contest (by slug/id) AND status 'voting' 
        // AND the submission exists 
        // AND user has not already voted for this specific submission
        const updatedContest = await Contest.findOneAndUpdate(
            {
                ...contestPath,
                status: 'voting',
                submissions: {
                    $elemMatch: {
                        _id: submissionObjectId,
                        voters: { $ne: userId }
                    }
                }
            },
            {
                $addToSet: { 'submissions.$.voters': userId },
                $inc: { 'submissions.$.votes': 1 }
            },
            { new: true }
        );

        if (!updatedContest) {
            // Analyze failure
            const contest = await Contest.findOne(contestPath);
            if (!contest) {
                return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
            }
            if (contest.status !== 'voting') {
                return NextResponse.json({ error: 'Voting is not open for this contest' }, { status: 400 });
            }
            const submission = contest.submissions.find((s: any) => s._id.equals(submissionObjectId));
            if (!submission) {
                return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
            }
            if (submission.voters.some((v: any) => v.toString() === userId)) {
                return NextResponse.json({ error: 'You have already voted for this submission' }, { status: 400 });
            }

            console.error('Unexpected vote recording failure:', {
                contestId: contest._id,
                contestSlug: params.slug,
                submissionId: params.submissionId,
                userId,
                submissionFound: !!submission
            });
            return NextResponse.json({ error: 'Unexpected error recording vote' }, { status: 500 });
        }

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
