import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import Audit from '@/models/Audit';
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
                    const slug = await generateUniqueSlug(Tour, tour.title, 'slug', false);
                    results.push({ id: tour._id, title: tour.title, slug });
                    
                    operations.push({
                        updateOne: {
                            filter: { _id: tour._id },
                            update: { $set: { slug } }
                        }
                    });
                }

                if (operations.length > 0) {
                    await Tour.bulkWrite(operations, { session: dbSession });
                }
            });

            // 4. Successful Audit Logging
            await Audit.create({
                action: 'TOUR_SLUG_MASS_MIGRATE',
                operator: operatorId,
                status: 'success',
                details: {
                    count: results.length,
                    results
                }
            });

            return NextResponse.json({
                message: `Successfully migrated ${results.length} tours.`,
                count: results.length
            });
        } catch (transactionError: any) {
            // 5. Failed Audit Logging
            await Audit.create({
                action: 'TOUR_SLUG_MASS_MIGRATE',
                operator: operatorId,
                status: 'failure',
                details: {
                    error: transactionError.message,
                    stack: transactionError.stack
                }
            });
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
