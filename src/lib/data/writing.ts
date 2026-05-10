import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import WritingProjectModel from '@/models/WritingProject';
import mongoose from 'mongoose';

export interface WritingProject {
    _id: string;
    author: {
        _id: string;
        name: string;
        image?: string;
        username?: string;
        rankTier?: string;
    };
    title: string;
    slug: string;
    coverImage?: string;
    introduction?: string;
    description?: string;
    category: string[];
    status: 'draft' | 'published';
    visibility: 'private' | 'public';
    chapters: Array<{
        _id: string;
        chapterNumber: number;
        title: string;
        slug: string;
        image?: string;
        content: string;
        wordCount: number;
        status: 'draft' | 'published';
        visibility: 'private' | 'public';
        createdAt: Date;
        updatedAt: Date;
    }>;
    totalWords: number;
    totalChapters: number;
    forSale: boolean;
    salePrice?: number;
    saleType?: 'physical' | 'pdf' | 'both';
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Helper to deep clone documents while preserving Date instances and stringifying ObjectIds.
 * This is crucial for Next.js Server Components to maintain sorting stability and type safety.
 */
const serializeDoc = (doc: any): any => {
    if (doc === null || doc === undefined) return doc;
    if (Array.isArray(doc)) return doc.map(serializeDoc);
    if (doc instanceof Date) return new Date(doc.getTime());
    if (doc instanceof mongoose.Types.ObjectId) return doc.toString();
    if (typeof doc === 'object') {
        const out: any = {};
        for (const key in doc) {
            if (Object.prototype.hasOwnProperty.call(doc, key)) {
                out[key] = serializeDoc(doc[key]);
            }
        }
        return out;
    }
    return doc;
};

/**
 * Cache factory for single writing projects to handle dynamic tags correctly.
 */
const projectCacheMap = new Map<string, Function>();

const getProjectCache = (slugOrId: string) => {
    if (!projectCacheMap.has(slugOrId)) {
        projectCacheMap.set(slugOrId, unstable_cache(
            async () => {
                if (!slugOrId) return null;
                try {
                    await dbConnect();
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
                    const query = isObjectId ? { _id: slugOrId } : { slug: slugOrId };

                    const project = await WritingProjectModel.findOne(query)
                        .populate('author', 'name image username')
                        .lean();
                    
                    return project ? serializeDoc(project) : null;
                } catch (error) {
                    console.error(`Error fetching writing project ${slugOrId}:`, error);
                    return null;
                }
            },
            [`writing-project-${slugOrId}`],
            {
                tags: ['writing', `writing-${slugOrId}`],
                revalidate: 3600
            }
        ));
    }
    return projectCacheMap.get(slugOrId)!;
};

/**
 * Cache factory for user-specific writing project lists.
 */
const userProjectsCacheMap = new Map<string, Function>();

const getUserProjectsCache = (userId: string) => {
    if (!userProjectsCacheMap.has(userId)) {
        userProjectsCacheMap.set(userId, unstable_cache(
            async () => {
                if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];
                try {
                    await dbConnect();
                    const projects = await WritingProjectModel.find({ author: userId })
                        .populate('author', 'name image username rankTier')
                        .sort({ updatedAt: -1 })
                        .lean();

                    return serializeDoc(projects);
                } catch (error) {
                    console.error(`Error fetching writing projects for user ${userId}:`, error);
                    return [];
                }
            },
            [`user-writing-projects-${userId}`],
            {
                tags: ['writing', `user-writing-${userId}`],
                revalidate: 3600
            }
        ));
    }
    return userProjectsCacheMap.get(userId)!;
};

/**
 * Fetch a single writing project by slug/id with persistent caching.
 */
export const getCachedWritingProject = cache(async (slugOrId: string): Promise<WritingProject | null> => {
    const cachedFn = getProjectCache(slugOrId);
    return cachedFn();
});

/**
 * Fetch all writing projects for a specific author with persistent caching.
 */
export const getCachedUserWritingProjects = cache(async (userId: string): Promise<WritingProject[]> => {
    const cachedFn = getUserProjectsCache(userId);
    return cachedFn();
});
