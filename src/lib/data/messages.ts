import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import mongoose from 'mongoose';

/**
 * Module-scoped fetcher for conversations to ensure persistent cross-request caching.
 */
const conversationsFetcher = (userId: string) => unstable_cache(
    async () => {
        await dbConnect();
        
        if (!userId || !mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid userId provided for conversation fetching');
        }
        
        const userObjectId = new mongoose.Types.ObjectId(userId);

        /**
         * Aggregate messages by conversation partner to get the unique conversation list.
         * Logic:
         * 1. Match all messages where user is sender or recipient.
         * 2. Sort by createdAt descending to get newest messages first.
         * 3. Group by the 'other participant' (the one who is NOT the current user).
         * 4. Take the first message from each group as the 'lastMessage'.
         */
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userObjectId }, { recipient: userObjectId }]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userObjectId] },
                            "$recipient",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$lastMessage" } },
            { $sort: { createdAt: -1 } },
            { $limit: 50 }
        ]);

        // Manually populate the sender and recipient fields for the aggregated messages
        const populatedConversations = await Message.populate(conversations, [
            { path: 'sender', select: 'name image' },
            { path: 'recipient', select: 'name image' }
        ]);

        return JSON.parse(JSON.stringify(populatedConversations));
    },
    ['conversations-list', userId],
    {
        tags: ['conversations', userId],
        revalidate: 60
    }
)();

/**
 * Fetch conversation list for a user with caching (Request Memoization + Persistent Cache)
 */
export const getCachedConversations = cache(
    async (userId: string) => {
        return conversationsFetcher(userId);
    }
);
