import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';
import { Types } from 'mongoose';

/**
 * Helper to prevent MongoDB operator injection
 */
const isSafeString = (val: any): val is string => {
    return typeof val === 'string' && val.trim().length > 0 && !val.startsWith('$');
};

/**
 * Helper to create a stable, deterministic string from a query object
 */
const stableStringify = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return JSON.stringify(obj);
    const sortedObj = Object.keys(obj)
        .sort()
        .filter(k => obj[k] !== undefined && obj[k] !== '')
        .reduce((acc: any, key) => {
            acc[key] = obj[key];
            return acc;
        }, {});
    return JSON.stringify(sortedObj);
};

/**
 * Module-scoped cached function for fetching contests
 */
const fetchContestsCached = unstable_cache(
    async (category: string, status: string, _stableKey: string) => {
        try {
            await dbConnect();
            
            let mongoFilter: any = {};

            if (isSafeString(category)) mongoFilter.category = category;
            if (isSafeString(status)) mongoFilter.status = status;

            const contests = await Contest.find(mongoFilter)
                .populate('winners.first.user', 'name image')
                .populate('winners.second.user', 'name image')
                .populate('winners.third.user', 'name image')
                .sort({ createdAt: -1 })
                .limit(30)
                .lean();

            return JSON.parse(JSON.stringify(contests));
        } catch (error) {
            console.error('Error fetching contests:', error);
            return [];
        }
    },
    ['contests-list'],
    {
        tags: ['contests'],
        revalidate: 3600
    }
);

/**
 * Bounded cache configuration for contest details.
 * Enforces a FIFO (First-In, First-Out) eviction strategy.
 */
const getRawCacheSize = process.env.CONTEST_CACHE_MAX_SIZE ? Number.parseInt(process.env.CONTEST_CACHE_MAX_SIZE, 10) : 500;
const MAX_CACHE_SIZE = (Number.isInteger(getRawCacheSize) && getRawCacheSize > 0) ? getRawCacheSize : 500;
const contestCacheMap = new Map<string, Function>();

const getContestByIdCache = (id: string) => {
    if (!contestCacheMap.has(id)) {
        // Enforce bounded cache size (FIFO eviction)
        if (contestCacheMap.size >= MAX_CACHE_SIZE) {
            const oldestKey = contestCacheMap.keys().next().value;
            if (oldestKey !== undefined) {
                contestCacheMap.delete(oldestKey);
            }
        }

        contestCacheMap.set(id, unstable_cache(
            async () => {
                if (!id || !Types.ObjectId.isValid(id)) {
                    return null;
                }

                try {
                    await dbConnect();
                    const contest = await Contest.findById(id)
                        .populate('winners.first.user', 'name image')
                        .populate('winners.second.user', 'name image')
                        .populate('winners.third.user', 'name image')
                        .populate('submissions.user', 'name image username')
                        .lean();
                    
                    return contest ? JSON.parse(JSON.stringify(contest)) : null;
                } catch (error) {
                    console.error(`Error fetching contest with ID ${id}:`, error);
                    return null;
                }
            },
            [`contest-detail-${id}`],
            {
                tags: ['contests', `contest-${id}`],
                revalidate: 3600
            }
        ));
    }
    return contestCacheMap.get(id)!;
};

/**
 * Fetch contests with caching
 */
export const getCachedContests = cache(
    async (query: { category?: string; status?: string }) => {
        const stableKey = stableStringify(query);
        return fetchContestsCached(
            query.category || '', 
            query.status || '', 
            stableKey
        );
    }
);

/**
 * Fetch a single contest by ID with caching
 */
export const getCachedContestById = cache(
    async (id: string) => {
        const cachedFn = getContestByIdCache(id);
        return cachedFn();
    }
);
