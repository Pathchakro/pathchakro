import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { unstable_cache } from 'next/cache';

export async function getLatestPosts(limit: number = 10) {
    try {
        await dbConnect();

        // Use unstable_cache to cache the database query results
        // This replicates the 'force-cache' behavior with revalidation tags
        const getCachedPosts = unstable_cache(
            async () => {
                const posts = await Post.find({})
                    .populate('author', 'name image rankTier')
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .lean();
                // Convert to serializable object
                return JSON.parse(JSON.stringify(posts));
            },
            [`posts-list-${limit}`],
            { tags: ['posts', `posts-list-${limit}`] }
        );

        return await getCachedPosts();
    } catch (error) {
        console.error('Error in getLatestPosts:', error);
        throw error;
    }
}

export async function getUserBookmarks(userId: string) {
    if (!userId) return [];

    try {
        await dbConnect();

        // Ensure Post model is loaded for population if needed
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = Post;

        const getCachedBookmarks = unstable_cache(
            async (id) => {
                const user = await User.findById(id)
                    .select('savedPosts')
                    .lean();

                if (!user || !user.savedPosts) return [];

                // Return just the IDs as strings
                return user.savedPosts.map((pid: any) => pid.toString());
            },
            [`user-bookmarks-${userId}`],
            { tags: [`bookmarks-${userId}`] }
        );

        return await getCachedBookmarks(userId);
    } catch (error) {
        console.error('Error fetching bookmarks for user:', error);
        throw error; // Or return empty array depending on preference, but user asked for explicit failure visibility
    }
}
