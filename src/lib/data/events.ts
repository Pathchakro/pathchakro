import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

/**
 * Module-scoped cached function for events list
 */
const fetchEvents = unstable_cache(
    async (destination: string, status: string, upcoming: boolean, page: number, limit: number) => {
        await dbConnect();
        
        const skip = (page - 1) * limit;
        let mongoFilter: any = {};

        if (destination) {
            mongoFilter.location = { $regex: destination, $options: 'i' };
        }
        
        if (status) {
            mongoFilter.status = status;
        }
        
        if (upcoming) {
            mongoFilter.startTime = { $gte: new Date() };
            const upcomingStatuses = ['upcoming', 'ongoing'];
            if (status) {
                // If status was already set, intersect it with upcoming statuses
                const currentStatus = Array.isArray(status) ? status : [status];
                const intersection = currentStatus.filter(s => upcomingStatuses.includes(s));
                mongoFilter.status = { $in: intersection };
            } else {
                mongoFilter.status = { $in: upcomingStatuses };
            }
        }

        const [events, totalEvents] = await Promise.all([
            Event.find(mongoFilter)
                .populate('organizer', 'name image rankTier')
                .populate('team', 'name')
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Event.countDocuments(mongoFilter)
        ]);

        const safeLimit = Math.max(1, limit);
        const totalPages = Math.ceil(totalEvents / safeLimit);

        return JSON.parse(JSON.stringify({
            events,
            pagination: {
                totalEvents,
                totalPages,
                currentPage: page,
                limit
            }
        }));
    },
    ['events-list'],
    {
        tags: ['events'],
        revalidate: 3600
    }
);

/**
 * Module-scoped cached function for single event
 */
const fetchSingleEvent = unstable_cache(
    async (slug: string) => {
        await dbConnect();
        
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
        const query = isObjectId ? { _id: slug } : { slug: slug };

        const event = await Event.findOne(query)
            .populate('organizer', 'name image rankTier')
            .populate('team', 'name')
            .populate('roles.speakers.user', 'name image')
            .populate('listeners.user', 'name image')
            .lean();

        return event ? JSON.parse(JSON.stringify(event)) : null;
    },
    ['event-detail'],
    {
        tags: ['events'],
        revalidate: 3600
    }
);

/**
 * Public export for fetching events with caching
 */
export const getCachedEvents = cache(
    async (query: { destination?: string; status?: string; upcoming?: boolean; page?: number; limit?: number }) => {
        return fetchEvents(
            query.destination || '',
            query.status || '',
            !!query.upcoming,
            query.page || 1,
            query.limit || 10
        );
    }
);

/**
 * Public export for fetching a single event by slug with caching
 */
export const getCachedEventBySlug = cache(
    async (slug: string) => {
        return fetchSingleEvent(slug);
    }
);
