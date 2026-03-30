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
        const results: any[] = [];

        // 2. Wrap in Mongoose Transaction for Atomicity
        const dbSession = await mongoose.startSession();
        
        try {
            await dbSession.withTransaction(async () => {
                const cursor = Tour.find({}).session(dbSession).cursor();
                
                try {
                    for await (const tour of cursor) {
                        const oldSlug = tour.slug;
                        const newSlug = await generateUniqueSlug(Tour, tour.title, 'slug', false, '', dbSession);
                        
                        tour.slug = newSlug;
                        await tour.save({ session: dbSession });
                        results.push({ id: tour._id, title: tour.title, old: oldSlug, new: newSlug });
                    }
                } finally {
                    await cursor.close();
                }

                // 3. Compact Audit Summary
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
                        action: 'TOUR_SLUG_FORCE_MIGRATE',
                        operatorId,
                        results
                    }], { session: dbSession });
                    migrationResultsId = migrationDoc._id;
                }

                // 4. Successful Audit Logging (Inside transaction for atomicity)
                await Audit.create([{
                    action: 'TOUR_SLUG_FORCE_MIGRATE',
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
                message: `Successfully re-migrated ${results.length} tours.`,
                count: results.length
            });
        } catch (transactionError: any) {
            // 4. Failed Audit Logging (Robust fallback)
            try {
                await Audit.create({
                    action: 'TOUR_SLUG_FORCE_MIGRATE',
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
        // 5. Secure Error Handling (Generic message for client, log for server)
        console.error('[TOUR_MIGRATE_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
