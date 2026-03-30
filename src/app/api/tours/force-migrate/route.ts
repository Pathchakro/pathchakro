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
        const results: any[] = [];

        // 2. Wrap in Mongoose Transaction for Atomicity
        const dbSession = await mongoose.startSession();
        
        try {
            await dbSession.withTransaction(async () => {
                const tours = await Tour.find({}).session(dbSession);
                
                for (const tour of tours) {
                    const oldSlug = tour.slug;
                    const newSlug = await generateUniqueSlug(Tour, tour.title, 'slug', false);
                    
                    tour.slug = newSlug;
                    await tour.save({ session: dbSession });
                    results.push({ id: tour._id, title: tour.title, old: oldSlug, new: newSlug });
                }
            });

            // 3. Successful Audit Logging
            await Audit.create({
                action: 'TOUR_SLUG_FORCE_MIGRATE',
                operator: operatorId,
                status: 'success',
                details: {
                    count: results.length,
                    results
                }
            });

            return NextResponse.json({
                message: `Successfully re-migrated ${results.length} tours.`,
                count: results.length
            });
        } catch (transactionError: any) {
            // 4. Failed Audit Logging
            await Audit.create({
                action: 'TOUR_SLUG_FORCE_MIGRATE',
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
        // 5. Secure Error Handling (Generic message for client, log for server)
        console.error('[TOUR_MIGRATE_ERROR]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
