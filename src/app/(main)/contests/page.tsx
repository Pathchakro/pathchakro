import { getCachedContests } from '@/lib/data/contests';
import ContestsClient from '@/components/contests/ContestsClient';

// Validation allowlists for search parameters
const VALID_CATEGORIES = ['story', 'poem', 'essay', 'article', 'review', 'academic', 'other'];
const VALID_STATUSES = ['active', 'upcoming', 'ended', 'all'];

export const metadata = {
    title: 'Writing Contests - Pathchakro',
    description: 'Participate in monthly writing competitions, win prizes, and showcase your talent at Pathchakro.',
};

export default async function ContestsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    
    // Validate category against allowlist
    const category = typeof searchParams.category === 'string' && VALID_CATEGORIES.includes(searchParams.category) 
        ? searchParams.category 
        : undefined;
        
    // Validate status against allowlist
    const status = typeof searchParams.status === 'string' && VALID_STATUSES.includes(searchParams.status) 
        ? searchParams.status 
        : undefined;

    // Direct database call with unstable_cache
    const contests = await getCachedContests({
        category,
        status
    });

    return <ContestsClient initialContests={contests} />;
}
