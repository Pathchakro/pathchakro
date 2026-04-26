import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import Team from '@/models/Team';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    const escapeRegex = (string: string): string => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

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

        const query = searchParams.get('q');
        if (query) {
            const escapedQuery = escapeRegex(query);
            // Find users matching the query to search in participant fields
            const matchingUsers = await User.find({ 
                name: { $regex: escapedQuery, $options: 'i' } 
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);

            const searchOr = [
                { title: { $regex: escapedQuery, $options: 'i' } },
                { description: { $regex: escapedQuery, $options: 'i' } },
                { 'roles.speakers.topic': { $regex: escapedQuery, $options: 'i' } },
                { organizer: { $in: userIds } },
                { 'roles.speakers.user': { $in: userIds } },
                { 'listeners.user': { $in: userIds } }
            ];

            if (filter.$or) {
                // Combine existing $or (like team filters) with search $or
                filter.$and = [
                    { $or: filter.$or },
                    { $or: searchOr }
                ];
                delete filter.$or;
            } else {
                filter.$or = searchOr;
            }
            
            // If we are searching, we might want to include both upcoming and past events
            // unless upcoming was explicitly requested.
            // If the user unchecks "upcoming only" in UI, 'upcoming' param will be false.
            if (!upcoming) {
                delete filter.status; // Remove status filter to show all
            }
        }

        const organizer = searchParams.get('organizer');
        if (organizer) {
            filter.organizer = organizer;
        }

        const events = await Event.find(filter)
            .populate('organizer', 'name image rankTier')
            .populate('team', 'name')
            .populate('roles.speakers.user', 'name image')
            .populate('listeners.user', 'name image')
            .sort({ startTime: 1 })
            .limit(50)
            .lean();

        // Auto-fix stale statuses for returned events
        const now = new Date();
        const processedEvents = events.map(event => {
            const startTime = new Date(event.startTime);
            // If event started more than 3 hours ago and is still 'upcoming' or 'ongoing'
            if (startTime.getTime() < now.getTime() - (3 * 60 * 60 * 1000) && 
                (event.status === 'upcoming' || event.status === 'ongoing')) {
                
                // Fire and forget update in DB
                Event.findByIdAndUpdate(event._id, { status: 'completed' }).exec()
                    .catch(err => console.error(`Failed to auto-complete event ${event._id}:`, err));
                return { ...event, status: 'completed' };
            }
            return event;
        });

        console.log('GET /api/events filter:', JSON.stringify(filter, null, 2));
        console.log('Found events:', processedEvents.length);

        return NextResponse.json({ events: processedEvents });
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
            startDate,
            startTime,
            teamId,
            banner,
        } = body;

        if (!title || !description || !eventType || !startDate || !startTime) {
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

        let event = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const slug = await generateUniqueSlug(Event, title);

                event = await Event.create({
                    organizer: session.user.id,
                    team: teamId || undefined,
                    title,
                    slug,
                    description,
                    eventType,
                    location,
                    meetingLink,
                    startTime: new Date(`${startDate}T${startTime}`),
                    banner,
                    status: 'upcoming',
                    roles: {
                        speakers: [],
                    },
                    listeners: [],
                });
                break;
            } catch (error: any) {
                if (error.code === 11000) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        continue;
                    }
                    // Break on final attempt to fall through to 409 response
                    break;
                }
                throw error;
            }
        }

        if (!event) {
            return NextResponse.json(
                { error: 'Failed to create event with a unique slug' },
                { status: 409 }
            );
        }

        const populatedEvent = await Event.findById(event._id)
            .populate('organizer', 'name image rankTier')
            .populate('team', 'name')
            .lean();

        revalidatePath('/', 'layout');
        revalidateTag('events', 'default');

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
