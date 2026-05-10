import { getCachedTours } from '@/lib/data/tours';
import ToursClient from '@/components/tours/ToursClient';

export const metadata = {
    title: 'Tours & Trips - Pathchakro',
    description: 'Discover and join educational tours and trips organized by the Pathchakro community.',
};

export default async function ToursPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const destination = typeof searchParams.destination === 'string' ? searchParams.destination : undefined;
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;
    const upcoming = searchParams.upcoming === 'true';
    const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined;

    // Direct database call with unstable_cache
    const tours = await getCachedTours({
        destination,
        status,
        upcoming,
        filter
    });

    return <ToursClient initialTours={tours} />;
}
