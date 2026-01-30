import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        await dbConnect();

        console.log('GET /api/events/[id] ID:', params.id);

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.id);
        let event = null;

        if (isObjectId) {
            event = await Event.findOne({ _id: params.id })
                .populate('organizer', 'name image rankTier')
                .populate('team', 'name')
                .populate('roles.host.user', 'name image')
                .populate('roles.anchor.user', 'name image')
                .populate('roles.summarizer.user', 'name image')
                .populate('roles.opener.user', 'name image')
                .populate('roles.closer.user', 'name image')
                .populate('roles.lecturers.user', 'name image')
                .populate('listeners.user', 'name image')
                .lean();
        }

        if (!event) {
            event = await Event.findOne({ slug: params.id })
                .populate('organizer', 'name image rankTier')
                .populate('team', 'name')
                .populate('roles.host.user', 'name image')
                .populate('roles.anchor.user', 'name image')
                .populate('roles.summarizer.user', 'name image')
                .populate('roles.opener.user', 'name image')
                .populate('roles.closer.user', 'name image')
                .populate('roles.lecturers.user', 'name image')
                .populate('listeners.user', 'name image')
                .lean();
        }

        console.log('Event found:', !!event);

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ event });
    } catch (error: any) {
        console.error('Error fetching event:', error);
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        );
    }
}


export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (event.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized to update this event' }, { status: 403 });
        }

        const body = await request.json();
        const {
            title, description, eventType, location,
            meetingLink, startTime, endTime, banner
        } = body;

        const updatedEvent = await Event.findByIdAndUpdate(
            event._id, // Use the resolved ID
            {
                title, description, eventType, location,
                meetingLink, startTime, endTime, banner
            },
            { new: true }
        );

        revalidatePath('/', 'layout');

        return NextResponse.json({ event: updatedEvent });
    } catch (error: any) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (event.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized to delete this event' }, { status: 403 });
        }

        await Event.findByIdAndDelete(event._id);

        revalidatePath('/', 'layout');

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
