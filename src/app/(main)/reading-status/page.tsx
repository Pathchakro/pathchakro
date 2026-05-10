import { getCachedReadingStatusReport } from '@/lib/data/reading-status';
import ReadingStatusClient from '@/components/reading-status/ReadingStatusClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const metadata = {
    title: 'Reading Status - Pathchakro',
    description: 'Track real-time reading activity, book popularity, and community learning progress.',
};

export default async function ReadingStatusPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await props.searchParams;

    // Normalize from/to parameters to handle both string and string[] inputs
    const rawFrom = Array.isArray(sp.from) ? sp.from[0] : sp.from;
    const rawTo = Array.isArray(sp.to) ? sp.to[0] : sp.to;

    const from = typeof rawFrom === 'string' ? rawFrom : format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const to = typeof rawTo === 'string' ? rawTo : format(endOfMonth(new Date()), 'yyyy-MM-dd');

    // Direct database call with unstable_cache
    const { report, summary } = await getCachedReadingStatusReport({ from, to });

    return (
        <ReadingStatusClient 
            initialStats={report} 
            initialSummary={summary} 
            from={from} 
            to={to} 
        />
    );
}
