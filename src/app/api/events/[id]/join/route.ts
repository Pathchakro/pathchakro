import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

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

        const { role, topic, duration } = await request.json();

        if (!role) {
            return NextResponse.json(
                { error: 'Role is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.id);
        let event = null;

        if (isObjectId) {
            event = await Event.findOne({ _id: params.id });
        }

        if (!event) {
            event = await Event.findOne({ slug: params.id });
        }

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        const userId = session.user.id;

        // Handle different role assignments
        if (role === 'lecturer') {
            if (!topic) {
                return NextResponse.json(
                    { error: 'Topic is required for lecturers' },
                    { status: 400 }
                );
            }

            // Check if already 5 lecturers
            if (event.roles.lecturers.length >= 5) {
                return NextResponse.json(
                    { error: 'Maximum 5 lecturers allowed' },
                    { status: 400 }
                );
            }

            // Check if user already a lecturer
            const existingLecturer = event.roles.lecturers.find(
                (l: any) => l.user.toString() === userId
            );

            if (existingLecturer) {
                return NextResponse.json(
                    { error: 'You are already registered as a lecturer' },
                    { status: 400 }
                );
            }

            event.roles.lecturers.push({
                user: userId,
                topic,
                duration: duration || 2,
                order: event.roles.lecturers.length + 1,
                assignedAt: new Date(),
            });
        } else if (['host', 'anchor', 'summarizer', 'opener', 'closer'].includes(role)) {
            // Check if role already taken
            if (event.roles[role]?.user) {
                return NextResponse.json(
                    { error: `${role} role is already taken` },
                    { status: 400 }
                );
            }

            event.roles[role] = {
                user: userId,
                assignedAt: new Date(),
            };
        } else if (role === 'listener') {
            // Check if already a listener
            const existingListener = event.listeners.find(
                (l: any) => l.user.toString() === userId
            );

            if (existingListener) {
                return NextResponse.json(
                    { error: 'You are already registered as a listener' },
                    { status: 400 }
                );
            }

            event.listeners.push({
                user: userId,
                joinedAt: new Date(),
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        await event.save();

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
