import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/models/Location';
import { bdLocations } from '@/lib/bd-locations';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Lazy Seeding
        const count = await Location.estimatedDocumentCount();
        if (count < bdLocations.length) {
            console.log(`Syncing locations (${count} found, ${bdLocations.length} expected)...`);
            try {
                // ordered: false to skip duplicates and continue
                await Location.insertMany(bdLocations, { ordered: false });
                console.log('Syncing locations complete.');
            } catch (error) {
                console.log('Syncing locations partial (some existed).');
            }
        }

        const locations = await Location.find({}).lean();
        return NextResponse.json({ locations });
    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch locations' },
            { status: 500 }
        );
    }
}
