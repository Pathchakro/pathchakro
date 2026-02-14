import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';

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

        let title, content;
        try {
            const body = await request.json();
            title = body.title;
            content = body.content;
        } catch (e) {
            return NextResponse.json(
                { error: 'Malformed JSON' },
                { status: 400 }
            );
        }

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const { slug } = params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
        const query = isObjectId ? { _id: slug } : { slug };

        // First check if contest exists and is active (for better error messaging)
        const contestCheck = await Contest.findOne(query).select('status');

        if (!contestCheck) {
            return NextResponse.json(
                { error: 'Contest not found' },
                { status: 404 }
            );
        }

        if (contestCheck.status !== 'active') {
            return NextResponse.json(
                { error: 'Contest is not accepting submissions' },
                { status: 400 }
            );
        }

        // Calculate word count
        const trimmedContent = content.trim();
        const wordCount = trimmedContent === '' ? 0 : trimmedContent.split(/\s+/).length;

        // Atomic update: Push submission ONLY if user hasn't submitted yet
        const updatedContest = await Contest.findOneAndUpdate(
            {
                ...query,
                'submissions.user': { $ne: session.user.id },
                status: 'active' // Double check status to be safe
            },
            {
                $push: {
                    submissions: {
                        user: session.user.id,
                        title,
                        content,
                        wordCount,
                        submittedAt: new Date(),
                        votes: 0,
                        voters: [],
                    }
                }
            },
            { new: true }
        );

        if (!updatedContest) {
            // If contest exists (checked above) but update failed, it means user already submitted
            // (or race condition on status change, but "Already submitted" is most likely/relevant)
            return NextResponse.json(
                { error: 'You have already submitted to this contest' },
                { status: 400 }
            );
        }

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
