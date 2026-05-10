import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import BloodDonor from '@/models/BloodDonor';

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Module-scoped cached function for fetching blood donors
 */
const fetchBloodDonors = unstable_cache(
    async (bloodGroup: string, location: string) => {
        try {
            await dbConnect();
            
            let mongoFilter: any = {};

            if (bloodGroup) mongoFilter.bloodGroup = bloodGroup;
            if (location) {
                const safeLocation = escapeRegex(location);
                mongoFilter.location = { $regex: safeLocation, $options: 'i' };
            }

            const donors = await BloodDonor.find(mongoFilter)
                .populate('user', 'name image rankTier')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();

            return JSON.parse(JSON.stringify(donors));
        } catch (error) {
            console.error('Error fetching blood donors:', error);
            return []; // Safe fallback
        }
    },
    ['blood-donors-list'],
    {
        tags: ['blood-donors'],
        revalidate: 3600
    }
);

/**
 * Fetch blood donors with caching
 * Standardizes the query interface while using persistent caching
 */
export const getCachedBloodDonors = async (query: { bloodGroup?: string; location?: string }) => {
    return fetchBloodDonors(query.bloodGroup || '', query.location || '');
};
