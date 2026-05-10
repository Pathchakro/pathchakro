import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import mongoose from 'mongoose';

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
 * Module-scoped fetcher for teams to ensure persistent cross-request caching.
 */
const teamsFetcher = unstable_cache(
    async (query: { type?: string; q?: string; filter?: string; userId?: string }) => {
        await dbConnect();
        
        const { type, q, filter, userId } = query;
        let mongoFilter: any = { privacy: { $in: ['public', 'team'] } };

        if (type && type !== 'all') mongoFilter.type = type;
        if (q) {
            // Escape regex meta-characters for security
            const escapedQ = q.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
            mongoFilter.name = { $regex: escapedQ, $options: 'i' };
        }

        if (filter === 'mine' && userId) {
            // Merge the "mine" predicate into existing constraints (privacy, type, name search)
            // using an $and to preserve all previous filters.
            const minePredicate = {
                $or: [
                    { leader: userId },
                    { 'members.user': userId }
                ]
            };
            mongoFilter = { $and: [mongoFilter, minePredicate] };
        }

        const teams = await Team.find(mongoFilter)
            .populate('leader', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return JSON.parse(JSON.stringify(teams));
    },
    ['teams-list'],
    {
        tags: ['teams'],
        revalidate: 3600
    }
);

/**
 * Fetch teams with caching (Request Memoization + Persistent Cache)
 */
export const getCachedTeams = cache(
    async (query: { type?: string; q?: string; filter?: string; userId?: string }) => {
        return teamsFetcher(query);
    }
);

/**
 * Module-scoped fetcher for a single team
 */
const teamBySlugFetcher = unstable_cache(
    async (slug: string) => {
        await dbConnect();
        
        // Prefer querying by slug first to support 24-char hex slugs
        let team = await Team.findOne({ slug: slug })
            .populate('leader', 'name image university rankTier')
            .populate('members.user', 'name image rankTier')
            .lean();

        // Fallback to _id lookup only if slug lookup fails and it's a valid ObjectId
        if (!team && mongoose.Types.ObjectId.isValid(slug)) {
            team = await Team.findOne({ _id: slug })
                .populate('leader', 'name image university rankTier')
                .populate('members.user', 'name image rankTier')
                .lean();
        }

        return team ? JSON.parse(JSON.stringify(team)) : null;
    },
    ['team-detail'],
    {
        revalidate: 3600
    }
);

/**
 * Fetch a single team by slug with caching
 */
export const getCachedTeamBySlug = cache(
    async (slug: string) => {
        return teamBySlugFetcher(slug);
    }
);
