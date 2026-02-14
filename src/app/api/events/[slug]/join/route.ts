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

        const { role, topic, duration } = await request.json();

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
        if (role === 'lecturer') {
            if (!topic) {
                return NextResponse.json(
                    { error: 'Topic is required for lecturers' },
                    { status: 400 }
                );
            }

            // Conditions: User not already lecturer, Max 5 lecturers
            updateQuery = {
                'roles.lecturers.user': { $ne: userId },
                $expr: { $lt: [{ $size: '$roles.lecturers' }, 5] }
            };

            updateData = {
                $push: {
                    'roles.lecturers': {
                        user: userId,
                        topic,
                        duration: duration ?? 2,
                        order: 0, // Placeholder, relying on array position
                        assignedAt: new Date(),
                    }
                }
            };
        } else if (['host', 'anchor', 'summarizer', 'opener', 'closer'].includes(role)) {
            // Condition: Role not already taken
            updateQuery = {
                [`roles.${role}.user`]: { $exists: false }
            };

            updateData = {
                $set: {
                    [`roles.${role}`]: {
                        user: userId,
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
            if (role === 'lecturer') {
                if (existingEvent.roles.lecturers.some((l: any) => l.user.toString() === userId)) {
                    return NextResponse.json({ error: 'You are already registered as a lecturer' }, { status: 400 });
                }
                if (existingEvent.roles.lecturers.length >= 5) {
                    return NextResponse.json({ error: 'Maximum 5 lecturers allowed' }, { status: 400 });
                }
            } else if (role === 'listener') {
                if (existingEvent.listeners.some((l: any) => l.user.toString() === userId)) {
                    return NextResponse.json({ error: 'You are already registered as a listener' }, { status: 400 });
                }
            } else {
                if (existingEvent.roles[role]?.user) {
                    return NextResponse.json({ error: `${role} role is already taken` }, { status: 400 });
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
