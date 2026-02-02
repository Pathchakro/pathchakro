import { auth } from '@/auth';
import HomeContent from '@/components/home/HomeContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pathchakro - Journey of Knowledge',
    description: 'Pathchakro is a community-driven platform for readers, learners, and educators. Explore book reviews, courses, events, and more.',
    openGraph: {
        title: 'Pathchakro - Journey of Knowledge',
        description: 'Explore book reviews, courses, events, and more on Pathchakro.',
        url: 'https://pathchakro.vercel.app',
        siteName: 'Pathchakro',
        type: 'website',
    },
};

async function getInitialData() {
    const session = await auth();
    const userId = session?.user?.id;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch feed and bookmarks in parallel
    const [feedRes, bookmarksRes] = await Promise.all([
        fetch(`${baseUrl}/api/feed?limit=10`, {
            cache: 'force-cache',
            next: { tags: ['feed'] }
        }),
        userId ? fetch(`${baseUrl}/api/users/bookmarks?userId=${userId}`, {
            cache: 'force-cache',
            next: { tags: [`bookmarks-${userId}`] }
        }) : Promise.resolve(null)
    ]);

    const feedData = await feedRes.json();
    let bookmarks = [];

    if (bookmarksRes) {
        try {
            if (bookmarksRes.ok) {
                const bookmarksData = await bookmarksRes.json();
                if (bookmarksData.bookmarks) {
                    bookmarks = bookmarksData.bookmarks.map((b: any) => b._id);
                }
            } else {
                console.error(`Failed to fetch bookmarks: ${bookmarksRes.status} ${bookmarksRes.statusText}`);
            }
        } catch (error) {
            console.error('Error parsing bookmarks data:', error);
        }
    }

    return {
        initialItems: feedData.items || [],
        initialCursor: feedData.nextCursor || null,
        initialBookmarks: bookmarks,
        session
    };
}

export default async function HomePage() {
    const data = await getInitialData();

    return (
        <HomeContent
            initialItems={data.initialItems}
            initialCursor={data.initialCursor}
            initialBookmarks={data.initialBookmarks}
            session={data.session}
        />
    );
}
