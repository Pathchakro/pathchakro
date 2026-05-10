import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { Types } from 'mongoose';

interface NotificationQuery {
    recipient: string;
    read?: boolean;
}

/**
 * Persistent cache factory for fetching notifications
 */
const fetchUserNotifications = (userId: string, unreadOnly: boolean) => unstable_cache(
    async () => {
        // Input validation
        if (!userId || !Types.ObjectId.isValid(userId)) {
            return [];
        }

        await dbConnect();
        
        const query: NotificationQuery = { recipient: userId };
        if (unreadOnly) query.read = false;

        const notifications = await Notification.find(query)
            .populate('sender', 'name image rankTier')
            .populate('post', 'content')
            .populate('team', 'name')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return notifications;
    },
    [`notifications-list-${userId}-${unreadOnly}`],
    {
        tags: ['notifications', `notifications-${userId}`],
        revalidate: 60 // Fast revalidate for notifications (1 minute)
    }
)();

/**
 * Public export for fetching notifications with caching
 * Uses React cache for per-request memoization and unstable_cache for persistence
 */
export const getCachedNotifications = cache(
    async (userId: string, unreadOnly: boolean = false) => {
        return fetchUserNotifications(userId, unreadOnly);
    }
);
