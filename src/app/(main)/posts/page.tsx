import { Metadata } from 'next';
import { auth } from '@/auth';
import PostsContent from '@/components/posts/PostsContent';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export const metadata: Metadata = {
    title: 'Explore Posts | Pathchakro',
    description: 'Read and discover the latest posts, book reviews, and educational content on Pathchakro. Join our community of readers and learners.',
    alternates: {
        canonical: 'https://pathchakro.vercel.app/posts',
    },
    openGraph: {
        title: 'Explore Posts | Pathchakro',
        description: 'Read and discover the latest posts and book reviews on Pathchakro.',
        url: 'https://pathchakro.vercel.app/posts',
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

    // Direct database call or fetch with cache
    // Using fetch to demonstrate revalidatePath/Tag if the API is internal but called via URL
    // However, since it's a server component, direct DB access is often preferred for initial load
    await dbConnect();

    const posts = await Post.find({})
        .populate('author', 'name image rankTier')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    let bookmarkedIds: string[] = [];
    if (userId) {
        try {
            // We can call an internal API or direct DB for bookmarks too
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/users/bookmarks?userId=${userId}`, {
                cache: 'force-cache',
                next: { tags: ['bookmarks', `bookmarks-${userId}`] }
            });
            const data = await response.json();
            if (data.bookmarks) {
                bookmarkedIds = data.bookmarks.map((b: any) => b._id);
            }
        } catch (error) {
            console.error('Error fetching bookmarks on server:', error);
        }
    }

    return {
        posts: JSON.parse(JSON.stringify(posts)),
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
        url: 'https://pathchakro.vercel.app/posts',
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
