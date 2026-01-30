import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Team from '@/models/Team';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');
        const status = searchParams.get('status');
        const upcoming = searchParams.get('upcoming') === 'true';

        let filter: any = {};

        if (teamId) {
            filter.team = teamId;
        } else {
            // Universal events (no team) or user has access
            filter.$or = [{ team: { $exists: false } }, { team: null }];
        }

        if (status) {
            filter.status = status;
        }

        if (upcoming) {
            filter.startTime = { $gte: new Date() };
            filter.status = { $in: ['upcoming', 'ongoing'] };
        }

        const organizer = searchParams.get('organizer');
        if (organizer) {
            filter.organizer = organizer;
        }

        const events = await Event.find(filter)
            .populate('organizer', 'name image rankTier')
            .populate('team', 'name')
            .populate('roles.host.user', 'name image')
            .populate('roles.anchor.user', 'name image')
            .populate('roles.summarizer.user', 'name image')
            .populate('roles.opener.user', 'name image')
            .populate('roles.closer.user', 'name image')
            .populate('roles.lecturers.user', 'name image')
            .populate('listeners.user', 'name image')
            .sort({ startTime: 1 })
            .limit(50)
            .lean();

        console.log('GET /api/events filter:', JSON.stringify(filter, null, 2));
        console.log('Found events:', events.length);

        return NextResponse.json({ events });
    } catch (error: any) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
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
        const {
            title,
            description,
            eventType,
            location,
            meetingLink,
            startTime,
            endTime,
            teamId,
            banner,
        } = body;

        if (!title || !description || !eventType || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        // Validate event type requirements
        if (eventType === 'offline' && !location) {
            return NextResponse.json(
                { error: 'Location is required for offline events' },
                { status: 400 }
            );
        }

        if (eventType === 'online' && !meetingLink) {
            return NextResponse.json(
                { error: 'Meeting link is required for online events' },
                { status: 400 }
            );
        }

        // Check if user is team leader (if team event)
        if (teamId) {
            const team = await Team.findById(teamId);
            if (!team || team.leader?.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'Only team leaders can create team events' },
                    { status: 403 }
                );
            }
        }

        await dbConnect();

        const event = await Event.create({
            organizer: session.user.id,
            team: teamId || undefined,
            title,
            description,
            eventType,
            location,
            meetingLink,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            banner,
            status: 'upcoming',
            roles: {
                lecturers: [],
            },
            listeners: [],
        });

        const populatedEvent = await Event.findById(event._id)
            .populate('organizer', 'name image rankTier')
            .populate('team', 'name')
            .lean();

        return NextResponse.json(
            { event: populatedEvent },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
