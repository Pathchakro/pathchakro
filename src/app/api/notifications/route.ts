import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        let filter: any = { recipient: session.user.id };
        if (unreadOnly) {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .populate('sender', 'name image rankTier')
            .populate('post', 'content')
            .populate('team', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const unreadCount = await Notification.countDocuments({
            recipient: session.user.id,
            read: false,
        });

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { recipientId, type, message, postId, commentId, teamId, reviewId } = body;

        if (!recipientId || !type || !message) {
            return NextResponse.json(
                { error: 'Recipient, type, and message are required' },
                { status: 400 }
            );
        }

        // Don't send notification to self
        if (recipientId === session.user.id) {
            return NextResponse.json({ success: true, notification: null });
        }

        await dbConnect();

        const notification = await Notification.create({
            recipient: recipientId,
            sender: session.user.id,
            type,
            message,
            post: postId || undefined,
            comment: commentId || undefined,
            team: teamId || undefined,
            review: reviewId || undefined,
            read: false,
        });

        return NextResponse.json({ success: true, notification });
    } catch (error: any) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}
