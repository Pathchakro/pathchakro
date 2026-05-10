import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Audit from '@/models/Audit';
import { generateUniqueSlug } from '@/lib/slug-utils';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // 1. Authentication & Authorization Check
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin privileges
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const operatorId = session.user.id;
        if (!operatorId) {
            return NextResponse.json({ error: 'Unauthorized: Operator ID missing' }, { status: 401 });
        }

        const results: any[] = [];
        const BATCH_SIZE = 100;
        let totalProcessed = 0;
        let totalUpdated = 0;
        
        // Track used slugs in-memory for this migration to avoid collisions before bulkWrite
        const usedSlugsInMigration = new Set<string>();

        // 2. Process in Batched Loop
        let hasMore = true;
        let skip = 0;

        while (hasMore) {
            const batchEvents = await Event.find({}).sort({ _id: 1 }).skip(skip).limit(BATCH_SIZE);
            if (batchEvents.length === 0) {
                hasMore = false;
                break;
            }

            const dbSession = await mongoose.startSession();
            try {
                const batchStats = await dbSession.withTransaction(async () => {
                    const batchOperations: any[] = [];
                    const batchResults: any[] = [];
                    const batchUsedSlugs: string[] = [];
                    let batchUpdatedCount = 0;

                    for (const event of batchEvents) {
                        const oldSlug = event.slug;
                        
                        // Generate new clean slug from title
                        let newSlug = await generateUniqueSlug(Event, event.title, 'slug', true, event._id.toString(), dbSession);
                        
                        // Resolve collisions (in-memory for this batch + database check)
                        let counter = 1;
                        const baseSlug = newSlug;
                        // Check both the migration's global set and the DB for collisions
                        while (usedSlugsInMigration.has(newSlug) || batchUsedSlugs.includes(newSlug) || await Event.exists({ slug: newSlug }).session(dbSession)) {
                            newSlug = `${baseSlug}-${counter}`;
                            counter++;
                        }

                        // Only update if it's actually different
                        if (oldSlug !== newSlug) {
                            batchUpdatedCount++;
                            batchResults.push({ id: event._id, title: event.title, oldSlug, newSlug });
                            batchUsedSlugs.push(newSlug);
                            
                            batchOperations.push({
                                updateOne: {
                                    filter: { _id: event._id },
                                    update: { $set: { slug: newSlug } }
                                }
                            });
                        }
                    }

                    if (batchOperations.length > 0) {
                        try {
                            await Event.bulkWrite(batchOperations, { session: dbSession });
                        } catch (bulkError: any) {
                            // Catch E11000 or other bulkWrite specific errors
                            if (bulkError.code === 11000) {
                                console.error('BulkWrite duplicate key error:', bulkError.message);
                                throw new Error('Duplicate key collision in bulkWrite');
                            }
                            throw bulkError;
                        }
                    }
                    
                    return { batchUpdatedCount, batchResults, batchUsedSlugs };
                });

                // Only update global state if transaction successfully committed
                totalUpdated += batchStats.batchUpdatedCount;
                batchStats.batchUsedSlugs.forEach(s => usedSlugsInMigration.add(s));
                if (results.length < 500) {
                    const spaceLeft = 500 - results.length;
                    results.push(...batchStats.batchResults.slice(0, spaceLeft));
                }
                
            } catch (batchError) {
                console.error(`Batch starting at ${skip} failed:`, batchError);
                // We don't increment totalUpdated or update results/usedSlugsInMigration here
            } finally {
                await dbSession.endSession();
            }

            totalProcessed += batchEvents.length;
            skip += BATCH_SIZE;
            if (batchEvents.length < BATCH_SIZE) {
                hasMore = false;
            }
        }

        // 3. Final Audit Logging (Summary)
        if (totalUpdated > 0) {
            await Audit.create([{
                action: 'EVENT_SLUG_MASS_FIX',
                operator: operatorId,
                status: 'success',
                details: {
                    totalProcessed,
                    totalUpdated,
                    results: results.length >= 500 ? 'Partial list (first 500)' : results
                }
            }]);
        }

        return NextResponse.json({
            message: `Migration complete. Processed ${totalProcessed} events. Updated ${totalUpdated} slugs.`,
            totalProcessed,
            totalUpdated,
            updates: results
        });

    } catch (error: any) {
        console.error('[EVENT_MIGRATE_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
