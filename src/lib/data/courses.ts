import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';

/**
 * Utility to escape regex special characters
 */
const escapeRegex = (str: string) => {
    return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Module-scoped fetcher for courses to enable persistent cross-request caching.
 * Replaces the double-wrapping pattern.
 */
const coursesFetcher = unstable_cache(
    async (query: { search?: string; filter?: string; userId?: string }) => {
        await dbConnect();
        
        const { search, filter, userId } = query;
        let mongoFilter: any = {};

        if (search) {
            // Escape regex meta-characters to prevent ReDoS and ensure literal matching
            const escapedSearch = escapeRegex(search);
            mongoFilter.title = { $regex: escapedSearch, $options: 'i' };
        }

        if (filter === 'mine' && userId) {
            mongoFilter.instructor = userId;
        }

        const courses = await Course.find(mongoFilter)
            .populate('instructor', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        return JSON.parse(JSON.stringify(courses));
    },
    ['courses-list'], // Base key
    {
        tags: ['courses'],
        revalidate: 3600
    }
);

/**
 * Exported cached function for use in components (Request Memoization + Persistent Cache)
 */
export const getCachedCourses = cache(
    async (query: { search?: string; filter?: string; userId?: string }) => {
        // We include the query in the key by passing it as an argument to the fetcher
        return coursesFetcher(query);
    }
);

/**
 * Module-scoped fetcher for a single course
 */
const courseBySlugFetcher = unstable_cache(
    async (slug: string) => {
        await dbConnect();
        const course = await Course.findOne({ slug })
            .populate('instructor', 'name image rankTier')
            .lean();
        return course ? JSON.parse(JSON.stringify(course)) : null;
    },
    ['course-detail'],
    {
        tags: ['courses'],
        revalidate: 3600
    }
);

/**
 * Fetch a single course by slug with caching
 */
export const getCachedCourseBySlug = cache(
    async (slug: string) => {
        // Returns cached course by slug
        return courseBySlugFetcher(slug);
    }
);
