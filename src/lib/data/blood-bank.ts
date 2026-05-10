import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';

/**
 * Fetch blood donors with caching and server-side authentication verification
 */
export const getCachedDonors = async (query: { bloodGroup?: string; district?: string; thana?: string }) => {
    // Server-side authentication check
    const session = await auth();
    const isAuth = !!session;

    // Stable serialization of the query to prevent cache misses due to key order
    const sortedQueryKeys = Object.keys(query).sort() as (keyof typeof query)[];
    const stableQuery = sortedQueryKeys.map(key => `${key}:${query[key]}`).join('-');
    const cacheKey = `donors-list-${stableQuery}-${isAuth}`;

    return unstable_cache(
        async () => {
            await dbConnect();
            
            const { bloodGroup, district, thana } = query;
            const filter: any = {
                bloodGroup: { $in: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
                willingToDonateBlood: true
            };

            if (bloodGroup && bloodGroup !== 'all') filter.bloodGroup = bloodGroup;
            if (district && district !== 'all') filter['address.present.district'] = district;
            if (thana && thana !== 'all') filter['address.present.thana'] = thana;

            // Selection fields based on server-verified authentication
            let projection = 'name image bloodGroup address willingToDonateBlood lastDateOfDonateBlood rankTier username title';
            if (isAuth) {
                projection += ' email whatsappNumber phone';
            }

            const donors = await User.find(filter)
                .select(projection)
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();

            // Sanitize MongoDB objects for client components
            return JSON.parse(JSON.stringify(donors));
        },
        [cacheKey],
        {
            tags: ['blood-bank', 'donors'],
            revalidate: 3600 // Cache for 1 hour
        }
    )();
};
