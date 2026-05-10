import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';

/**
 * Persistent cache factory for fetching tours
 */
const fetchTours = (destination: string, status: string, upcoming: boolean, filter: string = '', dateBoundary: string = '') => unstable_cache(
    async () => {
        try {
            await dbConnect();
            
            let mongoFilter: any = {};

            if (destination) {
                mongoFilter.destination = { $regex: destination, $options: 'i' };
            }
            
            if (status) {
                mongoFilter.status = status;
            }

            if (filter) {
                mongoFilter.title = { $regex: filter, $options: 'i' };
            }

            if (destination) {
                mongoFilter.destination = { $regex: destination, $options: 'i' };
            }
            
            if (status) {
                mongoFilter.status = status;
            }
            
            if (upcoming) {
                mongoFilter.startDate = { $gte: dateBoundary };
            }

            const tours = await Tour.find(mongoFilter)
                .populate('organizer', 'name image rankTier')
                .sort({ startDate: 1 })
                .limit(50)
                .lean();

            return JSON.parse(JSON.stringify(tours));
        } catch (error) {
            console.error('[TOURS_FETCH_ERROR]:', error);
            return [];
        }
    },
    [`tours-list-${destination}-${status}-${upcoming}-${filter}-${dateBoundary}`],
    {
        tags: ['tours'],
        revalidate: 3600
    }
)();

/**
 * Cache factory for individual tour details to handle dynamic tags correctly.
 */
const getTourCache = (slug: string) => {
    return unstable_cache(
        async () => {
            try {
                await dbConnect();
                
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
                const query = isObjectId ? { _id: slug } : { slug: slug };

                const tour = await Tour.findOne(query)
                    .populate('organizer', 'name image university rankTier')
                    .populate('participants.user', 'name image university rankTier')
                    .populate('team', 'name text')
                    .lean();

                return tour ? JSON.parse(JSON.stringify(tour)) : null;
            } catch (error) {
                console.error(`Error fetching tour ${slug}:`, error);
                return null;
            }
        },
        [`tour-detail-${slug}`],
        {
            tags: ['tours', `tour-${slug}`],
            revalidate: 3600
        }
    );
};

/**
 * Fetch tours with persistent caching.
 * Standardizes the query interface while using persistent caching factories.
 */
export const getCachedTours = cache(async (query: { destination?: string; status?: string; upcoming?: boolean; filter?: string }) => {
    // Only round current date if we are filtering for upcoming tours
    let dateBoundary: string | undefined;
    if (query.upcoming) {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        dateBoundary = now.toISOString();
    }

    return fetchTours(
        query.destination || '', 
        query.status || '', 
        query.upcoming || false,
        query.filter || '',
        dateBoundary || ''
    );
});

/**
 * Fetch a single tour by slug with persistent caching.
 */
export const getCachedTourBySlug = cache(async (slug: string) => {
    const cachedFn = getTourCache(slug);
    return cachedFn();
});
