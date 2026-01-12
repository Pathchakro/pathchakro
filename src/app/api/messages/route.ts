import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId'); // Other user to chat with

        await dbConnect();

        let messages;

        if (userId) {
            // Get conversation with specific user
            messages = await Message.find({
                $or: [
                    { sender: session.user.id, recipient: userId },
                    { sender: userId, recipient: session.user.id },
                ],
            })
                .populate('sender', 'name image')
                .populate('recipient', 'name image')
                .sort({ createdAt: 1 })
                .lean();

            // Mark messages as read
            await Message.updateMany(
                {
                    sender: userId,
                    recipient: session.user.id,
                    read: false,
                },
                { read: true }
            );
        } else {
            // Get all conversations (latest message from each user)
            const allMessages = await Message.find({
                $or: [
                    { sender: session.user.id },
                    { recipient: session.user.id },
                ],
            })
                .populate('sender', 'name image')
                .populate('recipient', 'name image')
                .sort({ createdAt: -1 })
                .lean();

            // Group by conversation partner
            const conversationsMap = new Map();

            allMessages.forEach((msg: any) => {
                const partnerId = msg.sender._id.toString() === session.user.id
                    ? msg.recipient._id.toString()
                    : msg.sender._id.toString();

                if (!conversationsMap.has(partnerId)) {
                    conversationsMap.set(partnerId, msg);
                }
            });

            messages = Array.from(conversationsMap.values());
        }

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
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

        const { recipientId, content } = await request.json();

        if (!recipientId || !content?.trim()) {
            return NextResponse.json(
                { error: 'Recipient and content are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const message = await Message.create({
            sender: session.user.id,
            recipient: recipientId,
            content,
            read: false,
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name image')
            .populate('recipient', 'name image')
            .lean();

        return NextResponse.json(
            { message: populatedMessage },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
