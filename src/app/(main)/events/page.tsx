import { Metadata } from 'next';
import EventsClient from './EventsClient';
import { getCachedEvents } from '@/lib/data/events';

export const metadata: Metadata = {
    title: 'Events | Pathchakro',
    description: 'Discover and join educational events and meetups on Pathchakro.',
};

export default async function EventsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const q = typeof searchParams.q === 'string' ? searchParams.q : Array.isArray(searchParams.q) ? searchParams.q[0] : undefined;
    const status = typeof searchParams.status === 'string' ? searchParams.status : Array.isArray(searchParams.status) ? searchParams.status[0] : undefined;
    
    // Normalize upcoming parameter, handling potential array input
    const upcomingParam = Array.isArray(searchParams.upcoming) ? searchParams.upcoming[0] : searchParams.upcoming;
    const upcoming = upcomingParam === 'true';
    
    const pageParam = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
    const page = Math.max(1, parseInt(typeof pageParam === 'string' ? pageParam : '1') || 1);

    try {
        // Fetch events via getCachedEvents (uses caching layer)
        const data = await getCachedEvents({
            destination: q,
            status,
            upcoming,
            page,
            limit: 10
        });

        return <EventsClient initialData={data} />;
    } catch (error) {
        console.error('Error in EventsPage:', error);
        return <EventsClient initialData={{ events: [], pagination: { totalEvents: 0, totalPages: 1, currentPage: 1, limit: 10 } }} />;
    }
}
