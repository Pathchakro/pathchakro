import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import ReadingProgress from '@/models/ReadingProgress';

export async function GET(
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

        await dbConnect();

        // params.id is the PROJECT ID (or slug, need to resolve if slug)
        // Ideally the frontend passes the resolved ID, but let's assume it might pass slug.
        // However, for progress tracking, ID is safer. 
        // We will assume the frontend passes the project ID for this internal API.

        const projectId = params.id;

        const progress = await ReadingProgress.findOne({
            user: session.user.id,
            project: projectId
        });

        return NextResponse.json({
            completedChapters: progress?.completedChapters || [],
            lastReadChapter: progress?.lastReadChapter
        });

    } catch (error) {
        console.error('Error fetching reading progress:', error);
        return NextResponse.json(
            { error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}

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

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON request body' },
                { status: 400 }
            );
        }

        const { chapterId, action, currentChapterId } = body;

        if (action && action !== 'complete' && action !== 'incomplete') {
            return NextResponse.json(
                { error: 'Invalid action. Must be "complete" or "incomplete"' },
                { status: 400 }
            );
        }

        if (action && (!chapterId || typeof chapterId !== 'string')) {
            return NextResponse.json(
                { error: 'chapterId is required and must be a string when an action is provided' },
                { status: 400 }
            );
        }

        if (currentChapterId && typeof currentChapterId !== 'string') {
            return NextResponse.json(
                { error: 'currentChapterId must be a string' },
                { status: 400 }
            );
        }
        const projectId = params.id;

        await dbConnect();

        let progress = await ReadingProgress.findOne({
            user: session.user.id,
            project: projectId
        });

        if (!progress) {
            progress = new ReadingProgress({
                user: session.user.id,
                project: projectId,
                completedChapters: [],
            });
        }

        if (action === 'complete') {
            if (!progress.completedChapters.some((id: any) => id.toString() === chapterId)) {
                progress.completedChapters.push(chapterId);
            }
        } else if (action === 'incomplete') {
            progress.completedChapters = progress.completedChapters.filter((id: any) => id.toString() !== chapterId);
        }

        if (currentChapterId) {
            progress.lastReadChapter = currentChapterId;
        }

        progress.lastReadAt = new Date();
        await progress.save();

        return NextResponse.json({
            success: true,
            completedChapters: progress.completedChapters,
            lastReadChapter: progress.lastReadChapter
        });

    } catch (error) {
        console.error('Error updating reading progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
}
