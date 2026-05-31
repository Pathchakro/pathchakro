import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Review from '@/models/Review';
import mongoose from 'mongoose';

/**
 * Fetch a single user by username (internal logic)
 */
async function getUserByUsername(username: string) {
    await dbConnect();
    let user = await User.findOne({ username })
        .select('-password -email')
        .lean();
    
    if (!user && mongoose.Types.ObjectId.isValid(username)) {
        user = await User.findById(username)
            .select('-password -email')
            .lean();
    }
    
    if (!user) return null;

    // Calculate stats in parallel
    const [reviewsCount, followingCount, followersCount] = await Promise.all([
        Review.countDocuments({ user: user._id }),
        User.countDocuments({ followers: user._id }),
        User.countDocuments({ following: user._id })
    ]);

    // Ensure the returned object is fully plain and serializable for unstable_cache
    return JSON.parse(JSON.stringify({
        user,
        stats: {
            reviews: reviewsCount,
            followers: followersCount,
            following: followingCount,
            points: user.points || 0
        }
    }));
}

/**
 * Cached version of getUserByUsername using unstable_cache for cross-request persistence.
 * Outer React cache() is removed to prevent redundant/incorrect caching layers.
 */
export async function getCachedUserByUsername(username: string) {
    return unstable_cache(
        async () => getUserByUsername(username),
        [`user-profile-${username}`],
        {
            tags: ['users', `user-${username}`],
            revalidate: 3600
        }
    )();
}
