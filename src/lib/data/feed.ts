import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import WritingProject from '@/models/WritingProject';
import Book from '@/models/Book';
import User from '@/models/User';

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


const fetchUnifiedFeed = async (query: { limit?: number; cursor?: string }) => {
    await dbConnect();

    const { limit = 10, cursor } = query;
    const filter: any = {};

    if (cursor) {
        const d = new Date(cursor);
        if (!Number.isNaN(d.getTime())) {
            filter.createdAt = { $lt: d };
        }
    }

    // Overfetch from each source to ensure merged pagination doesn't skip items.
    // We fetch 2x the requested limit to account for overlapping time windows.
    const overfetchLimit = limit * 2;

    const [reviews, projects] = await Promise.all([
        Review.find(filter)
            .populate('book', 'title author coverImage slug')
            .populate('user', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
            .lean(),
        WritingProject.find({ ...filter, visibility: 'public', status: 'published' })
            .populate('author', 'name image username rankTier')
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
            .lean()
    ]);

    // Combine, sort by createdAt globally, and slice to the requested limit.
    const allItems = [
        ...reviews.map((r: any) => ({ ...r, type: 'review' })),
        ...projects.map((p: any) => ({ ...p, type: 'writing_project' }))
    ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = allItems.slice(0, limit);

    // Determine next cursor only if there are more items beyond the returned slice
    const nextCursor = allItems.length > items.length ? items[items.length - 1].createdAt : null;

    return JSON.parse(JSON.stringify({
        items,
        nextCursor
    }));
};

/**
 * Exported cached feed fetcher (Request Memoization + Persistent Cache)
 */
export const getCachedFeed = cache(
    async (query: { limit?: number; cursor?: string }) => {
        return unstable_cache(
            () => fetchUnifiedFeed(query),
            ['feed-list', stableStringify(query)],
            {
                tags: ['feed'],
                revalidate: 3600
            }
        )();
    }
);
