import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

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

        const { role, topic } = await request.json();

        if (!role) {
            return NextResponse.json(
                { error: 'Role is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const { slug } = params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
        const queryBase = isObjectId ? { _id: slug } : { slug };

        const userId = session.user.id;
        let updateQuery: any = {};
        let updateData: any = {};

        // Configure update based on role
        if (role === 'speaker') {
            if (!topic) {
                return NextResponse.json(
                    { error: 'Topic is required for speakers' },
                    { status: 400 }
                );
            }

            // Conditions: User not already speaker, Max 5 speakers
            updateQuery = {
                'roles.speakers.user': { $ne: userId },
                $expr: { $lt: [{ $size: { $ifNull: ['$roles.speakers', []] } }, 5] }
            };

            updateData = {
                $push: {
                    'roles.speakers': {
                        user: userId,
                        topic,
                        order: 0, // Placeholder, relying on array position
                        assignedAt: new Date(),
                    }
                }
            };
        } else if (role === 'listener') {
            // Condition: Not already listener
            updateQuery = {
                'listeners.user': { $ne: userId }
            };

            updateData = {
                $push: {
                    listeners: {
                        user: userId,
                        joinedAt: new Date(),
                    }
                }
            };
        } else {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Execute Atomic Update
        const updatedEvent = await Event.findOneAndUpdate(
            { ...queryBase, ...updateQuery },
            updateData,
            { new: true }
        );

        if (!updatedEvent) {
            // Failure analysis: Check why it failed
            const existingEvent = await Event.findOne(queryBase);

            if (!existingEvent) {
                return NextResponse.json(
                    { error: 'Event not found' },
                    { status: 404 }
                );
            }

            // Diagnostic checks based on role
            if (role === 'speaker') {
                if (existingEvent.roles?.speakers?.some((l: any) => l.user?.toString() === userId)) {
                    return NextResponse.json({ error: 'You are already registered as a speaker' }, { status: 400 });
                }
                if ((existingEvent.roles?.speakers?.length || 0) >= 5) {
                    return NextResponse.json({ error: 'Maximum 5 speakers allowed' }, { status: 400 });
                }
            } else if (role === 'listener') {
                if (existingEvent.listeners?.some((l: any) => l.user?.toString() === userId)) {
                    return NextResponse.json({ error: 'You are already registered as a listener' }, { status: 400 });
                }
            }
            // Fallback generic error
            return NextResponse.json(
                { error: 'Failed to assign role (conditions not met)' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: `Successfully registered as ${role}`,
            success: true,
        });

    } catch (error: any) {
        console.error('Error assigning role:', error);
        return NextResponse.json(
            { error: 'Failed to assign role' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        await dbConnect();

        const { slug } = params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
        const queryBase = isObjectId ? { _id: slug } : { slug };
        const userId = session.user.id;

        // Atomic update to remove user from both potential arrays
        const updatedEvent = await Event.findOneAndUpdate(
            queryBase,
            {
                $pull: {
                    'roles.speakers': { user: userId },
                    'listeners': { user: userId }
                }
            },
            { new: true }
        );

        if (!updatedEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Successfully cancelled participation',
            success: true,
        });

    } catch (error: any) {
        console.error('Error cancelling participation:', error);
        return NextResponse.json(
            { error: 'Failed to cancel participation' },
            { status: 500 }
        );
    }
}
