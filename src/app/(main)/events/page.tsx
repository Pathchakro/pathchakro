import { Metadata } from 'next';
import EventsClient from './EventsClient';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export const metadata: Metadata = {
    title: 'Events | Pathchakro',
    description: 'Discover and join educational events and meetups on Pathchakro.',
};

export default async function EventsPage() {
    try {
        await dbConnect();

        // Fetch initial events (upcoming by default)
        const eventData = await Event.find({
            $or: [{ team: { $exists: false } }, { team: null }],
            startTime: { $gte: new Date() },
            status: { $in: ['upcoming', 'ongoing'] }
        })
            .populate('organizer', 'name image rankTier')
            .populate('team', 'name')
            .sort({ startTime: 1 })
            .limit(20)
            .lean();

        // Serialize data for Client Component
        const serializedEvents = JSON.parse(JSON.stringify(eventData));

        return <EventsClient initialEvents={serializedEvents} />;
    } catch (error) {
        console.error('Error in EventsPage:', error);
        // Fallback UI to prevent page crash on DB error
        return <EventsClient initialEvents={[]} />;
    }
}
