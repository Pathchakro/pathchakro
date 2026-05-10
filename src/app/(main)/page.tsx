import { auth } from '@/auth';
import HomeContent from '@/components/home/HomeContent';
import { Metadata } from 'next';
import { getCachedFeed } from '@/lib/data/feed';
import { getCachedSavedReviewIds } from '@/lib/data/reviews';

export const metadata: Metadata = {
    title: 'Pathchakro - Journey of Knowledge',
    description: 'Pathchakro is a community-driven platform for readers, learners, and educators. Explore book reviews, courses, events, and more.',
    openGraph: {
        title: 'Pathchakro - Journey of Knowledge',
        description: 'Explore book reviews, courses, events, and more on Pathchakro.',
        url: 'https://www.pathchakro.com',
        siteName: 'Pathchakro',
        type: 'website',
    },
};

export default async function HomePage() {
    const session = await auth();
    const userId = session?.user?.id;

    // Define safe fallbacks
    let feedData: any = { items: [], nextCursor: null };
    let bookmarks: string[] = [];

    try {
        // Parallel direct database calls with unstable_cache
        const [fetchedFeed, fetchedBookmarks] = await Promise.all([
            getCachedFeed({ limit: 10 }),
            userId ? getCachedSavedReviewIds(userId) : Promise.resolve([])
        ]);
        
        feedData = fetchedFeed || feedData;
        bookmarks = fetchedBookmarks || bookmarks;
    } catch (error) {
        console.error('[HOME_PAGE_DATA_FETCH_ERROR]:', error);
        // Page remains functional with default fallback values
    }

    return (
        <HomeContent
            initialItems={feedData?.items || []}
            initialCursor={feedData?.nextCursor || null}
            initialBookmarks={bookmarks || []}
            session={session}
        />
    );
}
