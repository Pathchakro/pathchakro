import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;

    try {
        await dbConnect();

        console.log('GET /api/events/[slug] ID:', params.slug);

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);
        let event = null;

        if (isObjectId) {
            event = await Event.findOne({ _id: params.slug })
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
            event = await Event.findOne({ slug: params.slug })
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
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);
        let event = null;

        if (isObjectId) {
            event = await Event.findOne({ _id: params.slug });
        }

        if (!event) {
            event = await Event.findOne({ slug: params.slug });
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

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (eventType !== undefined) updateData.eventType = eventType;
        if (location !== undefined) updateData.location = location;
        if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
        if (startTime !== undefined) updateData.startTime = startTime;
        if (endTime !== undefined) updateData.endTime = endTime;
        if (banner !== undefined) updateData.banner = banner;

        const updatedEvent = await Event.findByIdAndUpdate(
            event._id, // Use the resolved ID
            { $set: updateData },
            { new: true }
        );

        revalidatePath('/', 'layout');
        revalidateTag('events', 'default');

        return NextResponse.json({ event: updatedEvent });
    } catch (error: any) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);
        let event = null;

        if (isObjectId) {
            event = await Event.findOne({ _id: params.slug });
        }

        if (!event) {
            event = await Event.findOne({ slug: params.slug });
        }

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (event.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized to delete this event' }, { status: 403 });
        }

        await Event.findByIdAndDelete(event._id);

        revalidatePath('/', 'layout');
        revalidateTag('events', 'default');

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
