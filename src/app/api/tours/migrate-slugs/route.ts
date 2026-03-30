import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import Audit from '@/models/Audit';
import MigrationResults from '@/models/MigrationResults';
import { generateUniqueSlug } from '@/lib/slug-utils';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // 1. Authentication & Authorization Check
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const operatorId = session.user.id;

        // 2. Find all tours that don't have a slug
        const toursWithoutSlugs = await Tour.find({
            $or: [
                { slug: { $exists: false } },
                { slug: '' },
                { slug: null }
            ]
        });

        if (toursWithoutSlugs.length === 0) {
            return NextResponse.json({ message: 'No tours require slug migration.' });
        }

        const results: any[] = [];
        const operations: any[] = [];

        // 3. Wrap in Mongoose Transaction for Atomicity
        const dbSession = await mongoose.startSession();
        
        try {
            await dbSession.withTransaction(async () => {
                for (const tour of toursWithoutSlugs) {
                    const slug = await generateUniqueSlug(Tour, tour.title, 'slug', false, '', dbSession);
                    results.push({ id: tour._id, title: tour.title, slug });
                    
                    operations.push({
                        updateOne: {
                            filter: { 
                                _id: tour._id,
                                $or: [
                                    { slug: { $exists: false } },
                                    { slug: '' },
                                    { slug: null }
                                ]
                            },
                            update: { $set: { slug } }
                        }
                    });
                }

                if (operations.length > 0) {
                    await Tour.bulkWrite(operations, { session: dbSession });
                }

                // 4. Compact Audit Summary
                const totalCount = results.length;
                const isLarge = totalCount > 1000;
                const summary = {
                    totalCount,
                    sample: isLarge 
                        ? [...results.slice(0, 5), ...results.slice(-5)] 
                        : results,
                    isLarge
                };

                let migrationResultsId = null;
                if (isLarge) {
                    const [migrationDoc] = await MigrationResults.create([{
                        action: 'TOUR_SLUG_MASS_MIGRATE',
                        operatorId,
                        results
                    }], { session: dbSession });
                    migrationResultsId = migrationDoc._id;
                }

                // 5. Successful Audit Logging (Inside transaction for atomicity)
                await Audit.create([{
                    action: 'TOUR_SLUG_MASS_MIGRATE',
                    operator: operatorId,
                    status: 'success',
                    details: {
                        ...summary,
                        migrationResultsId,
                        // Always include full results if under threshold for convenience
                        results: isLarge ? undefined : results
                    }
                }], { session: dbSession });
            });

            return NextResponse.json({
                message: `Successfully migrated ${results.length} tours.`,
                count: results.length
            });
        } catch (transactionError: any) {
            // 5. Failed Audit Logging (Robust fallback)
            try {
                await Audit.create({
                    action: 'TOUR_SLUG_MASS_MIGRATE',
                    operator: operatorId,
                    status: 'failure',
                    details: {
                        error: transactionError.message,
                        stack: transactionError.stack
                    }
                });
            } catch (auditError) {
                console.error('[AUDIT_ERROR]: Failed to create failure audit record', auditError);
            }
            throw transactionError;
        } finally {
            await dbSession.endSession();
        }
    } catch (error: any) {
        // 6. Secure Error Handling (Generic message for client, log for server)
        console.error('[TOUR_MIGRATE_MASS_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
