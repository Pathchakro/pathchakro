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
            let userIds: any[] = [];
            try {
                const matchingUsers = await User.find({ 
                    name: { $regex: escapedQuery, $options: 'i' } 
                }).select('_id');
                userIds = matchingUsers.map(u => u._id);
            } catch (userError) {
                console.error('Error finding matching users for event search:', userError);
                // Gracefully degrade: continue search without user-based filters
            }

            const searchOr = [
                { title: { $regex: escapedQuery, $options: 'i' } },
                { description: { $regex: escapedQuery, $options: 'i' } },
                { 'roles.speakers.topic': { $regex: escapedQuery, $options: 'i' } },
                { organizer: { $in: userIds } },
                { 'roles.speakers.user': { $in: userIds } },
                { 'listeners.user': { $in: userIds } }
            ];

            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    { $or: searchOr }
                ];
                delete filter.$or;
            } else {
                filter.$or = searchOr;
            }
            
            if (!upcoming) {
                delete filter.status;
            }
        }

        const organizer = searchParams.get('organizer');
        if (organizer) {
            filter.organizer = organizer;
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const [events, totalEvents] = await Promise.all([
            Event.find(filter)
                .populate('organizer', 'name image rankTier')
                .populate('team', 'name')
                .populate('roles.speakers.user', 'name image')
                .populate('listeners.user', 'name image')
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Event.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalEvents / limit);

        const now = new Date();
        const processedEvents = events.map(event => {
            const startTime = new Date(event.startTime);
            if (startTime.getTime() < now.getTime() - (3 * 60 * 60 * 1000) && 
                (event.status === 'upcoming' || event.status === 'ongoing')) {
                // Return 'completed' in response for stale events without mutating DB in GET handler
                return { ...event, status: 'completed' };
            }
            return event;
        });

        return NextResponse.json({ 
            events: processedEvents,
            pagination: {
                totalEvents,
                totalPages,
                currentPage: page,
                limit
            }
        });
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
            recordingLink,
            slug: customSlug,
        } = body;

        if (!title || !description || !eventType || !startDate || !startTime) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

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

        await dbConnect();

        if (teamId) {
            const team = await Team.findById(teamId);
            if (!team || team.leader?.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'Only team leaders can create team events' },
                    { status: 403 }
                );
            }
        }

        // Robust customSlug validation and sanitization
        let validatedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile', 'events', 'teams'].includes(trimmed);
            
            if (trimmed.length >= 3 && trimmed.length <= 100 && isValidPattern && !isReserved) {
                validatedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 3-100 characters, lowercase letters, numbers, and hyphens. No reserved words.' },
                    { status: 400 }
                );
            }
        }

        let event = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                let slugBase = validatedSlug || title;
                if (!validatedSlug && startDate) {
                    slugBase = `${title}-${startDate}`;
                }
                
                // Fixed: Removed the undefined 'dbSession' argument
                const slug = await generateUniqueSlug(Event, slugBase, 'slug', false, '');

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
                    recordingLink,
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
                    if (attempts < maxAttempts) continue;
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
