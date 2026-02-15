import { Metadata } from 'next';
import { auth } from '@/auth';
import PostsContent from '@/components/posts/PostsContent';
import { getLatestPosts, getUserBookmarks } from '@/lib/data-service';

export const metadata: Metadata = {
    title: 'Explore Posts | Pathchakro',
    description: 'Read and discover the latest posts, book reviews, and educational content on Pathchakro. Join our community of readers and learners.',
    alternates: {
        canonical: 'https://www.pathchakro.com/posts',
    },
    openGraph: {
        title: 'Explore Posts | Pathchakro',
        description: 'Read and discover the latest posts and book reviews on Pathchakro.',
        url: 'https://www.pathchakro.com/posts',
        siteName: 'Pathchakro',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Explore Posts | Pathchakro',
        description: 'Read and discover the latest posts and book reviews on Pathchakro.',
    },
};



async function getInitialData() {
    const session = await auth();
    const userId = session?.user?.id;

    let posts = [];
    try {
        // Direct function call instead of fetch
        posts = await getLatestPosts();
    } catch (error) {
        console.error('Error fetching latest posts:', error);
        // Throwing error to ensure failure is visible and deterministic as requested
        throw error;
    }

    let bookmarkedIds: string[] = [];
    if (userId) {
        try {
            // Direct function call for bookmarks
            bookmarkedIds = await getUserBookmarks(userId);
        } catch (error) {
            console.error(`Error fetching bookmarks for user ${userId}:`, error);
            // Bookmarks are non-critical, so we can allow fallback to empty array
            // but the error is logged for debugging.
        }
    }

    return {
        posts,
        userId,
        bookmarkedIds
    };
}

export default async function PostsPage() {
    const { posts, userId, bookmarkedIds } = await getInitialData();

    // Structured Data (JSON-LD)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Explore Posts | Pathchakro',
        description: 'A collection of posts and book reviews from the Pathchakro community.',
        url: 'https://www.pathchakro.com/posts',
    };

    return (
        <div className="max-w-2xl mx-auto p-4 min-h-screen pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <h1 className="text-2xl font-bold mb-6">Posts</h1>

            <PostsContent
                initialPosts={posts}
                currentUserId={userId}
                initialBookmarks={bookmarkedIds}
            />
        </div>
    );
}
