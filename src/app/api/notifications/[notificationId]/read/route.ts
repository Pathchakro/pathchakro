import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ notificationId: string }> }
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

        const notification = await Notification.findOneAndUpdate(
            { _id: params.notificationId, recipient: session.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}
