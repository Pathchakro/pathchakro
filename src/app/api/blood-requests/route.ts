import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const bloodType = searchParams.get('bloodType');
        const location = searchParams.get('location');
        const urgency = searchParams.get('urgency');

        let filter: any = { status: 'active', expiresAt: { $gt: new Date() } };

        if (bloodType) filter.bloodType = bloodType;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (urgency) filter.urgency = urgency;

        const requests = await BloodRequest.find(filter)
            .populate('requester', 'name image university thana')
            .sort({ urgency: -1, createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ requests });
    } catch (error: any) {
        console.error('Error fetching blood requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blood requests' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            patientName,
            bloodType,
            unitsNeeded,
            urgency,
            location,
            hospital,
            contactNumber,
            additionalInfo,
        } = body;

        if (!patientName || !bloodType || !unitsNeeded || !location || !hospital || !contactNumber) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Calculate expiry (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Generate anonymous slug: hospital-date-unique
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        const baseSlugString = `blood-request-${hospital}-${dateStr}`;
        const slug = await generateUniqueSlug(BloodRequest, baseSlugString);

        const bloodRequest = await BloodRequest.create({
            requester: session.user.id,
            patientName,
            slug,
            bloodType,
            unitsNeeded,
            urgency: urgency || 'normal',
            location,
            hospital,
            contactNumber,
            additionalInfo,
            status: 'active',
            expiresAt,
        });

        const populatedRequest = await BloodRequest.findById(bloodRequest._id)
            .populate('requester', 'name image university thana')
            .lean();

        return NextResponse.json(
            { request: populatedRequest },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating blood request:', error);
        return NextResponse.json(
            { error: 'Failed to create blood request' },
            { status: 500 }
        );
    }
}
