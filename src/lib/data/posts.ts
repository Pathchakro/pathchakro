import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

/**
 * Deterministic serialization of query objects for stable cache keys.
 */
const stableStringify = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',') + '}';
};

/**
 * Module-scoped fetcher for posts to ensure persistent cross-request caching.
 * Relying solely on unstable_cache as per user instructions to avoid React cache reference comparison issues.
 */
const postsFetcher = unstable_cache(
    async (query: { author?: string; limit?: number }, _stableKey: string) => {
        await dbConnect();
        
        const { author, limit = 10 } = query;
        const mongoFilter: any = {};
        if (author) mongoFilter.author = author;

        const posts = await Post.find(mongoFilter)
            .populate('author', 'name image username')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return JSON.parse(JSON.stringify(posts));
    },
    ['posts-list'],
    {
        tags: ['posts'],
        revalidate: 3600
    }
);

/**
 * Fetch posts with caching
 */
export const getCachedPosts = async (query: { author?: string; limit?: number }) => {
    const stableKey = stableStringify(query);
    return postsFetcher(query, stableKey);
};

/**
 * Module-scoped fetcher for a single post by slug
 */
const postBySlugFetcher = unstable_cache(
    async (slug: string) => {
        await dbConnect();
        const post = await Post.findOne({ slug })
            .populate('author', 'name image username rankTier')
            .lean();
        return post ? JSON.parse(JSON.stringify(post)) : null;
    },
    ['post-detail'],
    {
        tags: ['posts'],
        revalidate: 3600
    }
);

/**
 * Fetch a single post by slug with caching
 */
export const getCachedPostBySlug = async (slug: string) => {
    return postBySlugFetcher(slug);
};
