import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import mongoose from 'mongoose';

/**
 * Fetch assignments with caching
 */
export const getCachedAssignments = cache(
    async (query: { role?: string; userId?: string }) => {
        const { role, userId } = query;

        // Validation for userId if provided
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return [];
        }

        // Deterministic cache key
        const sortedQueryKey = JSON.stringify(Object.keys(query).sort().reduce((obj: any, key: string) => {
            obj[key] = (query as any)[key];
            return obj;
        }, {}));

        return unstable_cache(
            async () => {
                try {
                    await dbConnect();
                    
                    let mongoFilter: any = {};

                    if (role === 'teacher' && userId) {
                        mongoFilter.teacher = userId;
                    } else if (userId) {
                        // Enforce authorization for non-teachers: must be a student or part of the team
                        mongoFilter.$or = [
                            { 'submissions.student': userId },
                            { teamMembers: userId } // Assuming teamMembers exists or is part of schema
                        ];
                    } else {
                        // If no userId provided and not a public fetch, restrict
                        throw new Error('Unauthorized: userId is required for assignment listing');
                    }

                    const assignments = await Assignment.find(mongoFilter)
                        .populate('teacher', 'name image')
                        .populate('team', 'name')
                        .sort({ dueDate: 1 })
                        .limit(50)
                        .lean();

                    return JSON.parse(JSON.stringify(assignments));
            },
            [`assignments-list-${sortedQueryKey}`],
            {
                tags: ['assignments'],
                revalidate: 3600
            }
        )();
    }
);

/**
 * Fetch a single assignment by ID with caching
 */
export const getCachedAssignmentById = cache(
    async (id: string) => {
        // Validation for id
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        return unstable_cache(
            async () => {
                try {
                    await dbConnect();
                    const assignment = await Assignment.findById(id)
                        .populate('teacher', 'name image')
                        .populate('team', 'name')
                        .populate('submissions.student', 'name image username')
                        .lean();
                    
                    if (!assignment) return null;
                    
                    return JSON.parse(JSON.stringify(assignment));
                } catch (error) {
                    console.error(`Failed to fetch assignment with id ${id}:`, error);
                    return null;
                }
            },
            [`assignment-detail-${id}`],
            {
                tags: ['assignments', `assignment-${id}`],
                revalidate: 3600
            }
        )();
    }
);
