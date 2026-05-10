import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Module-scoped cached function for blood requests list
 */
const fetchBloodRequests = unstable_cache(
    async (group: string, district: string, area: string, status: string) => {
        await dbConnect();
        
        let mongoFilter: any = {};
        if (group) mongoFilter.bloodGroup = group;
        if (district) mongoFilter.district = district;
        if (area) mongoFilter.area = { $regex: escapeRegex(area), $options: 'i' };
        
        if (status) mongoFilter.status = status;
        else mongoFilter.status = 'active';

        const requests = await BloodRequest.find(mongoFilter)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return JSON.parse(JSON.stringify(requests));
    },
    ['blood-requests-list'],
    {
        tags: ['blood-requests'],
        revalidate: 3600
    }
);

/**
 * Module-scoped cached function for single blood request
 */
const fetchSingleBloodRequest = unstable_cache(
    async (slug: string) => {
        await dbConnect();
        const request = await BloodRequest.findOne({ slug }).lean();
        return request ? JSON.parse(JSON.stringify(request)) : null;
    },
    ['blood-request-detail'],
    {
        tags: ['blood-requests'],
        revalidate: 3600
    }
);

/**
 * Public export for fetching blood requests list
 */
export const getCachedBloodRequests = cache(
    async (query: { group?: string; district?: string; area?: string; status?: string }) => {
        return fetchBloodRequests(
            query.group || '',
            query.district || '',
            query.area || '',
            query.status || ''
        );
    }
);

/**
 * Public export for fetching a single blood request by slug
 */
export const getCachedBloodRequestBySlug = cache(
    async (slug: string) => {
        return fetchSingleBloodRequest(slug);
    }
);
