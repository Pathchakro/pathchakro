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
            slug: customSlug,
        } = body;

        if (!patientName || !bloodType || !unitsNeeded || !location || !hospital || !contactNumber) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        let finalBaseSlug = `blood-request-${hospital.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${dateStr}`;

        // 1. Validate and Sanitize Custom Slug if provided
        if (customSlug && typeof customSlug === 'string') {
            const sanitized = customSlug.trim()
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .slice(0, 64);

            // Basic validation for format
            if (sanitized.length < 3 || sanitized === '---') {
                return NextResponse.json(
                    { error: 'Custom slug is too short or invalid' },
                    { status: 400 }
                );
            }

            // PII check (simple regex for email/phone patterns)
            const containsPII = /[\w.-]+@[\w.-]+\.\w{2,}|(\+?\d{1,3}[- ]?)?\d{10,12}/.test(sanitized);
            
            if (!containsPII) {
                finalBaseSlug = sanitized;
            } else {
                // Log the attempt and fallback to anonymous slug for security
                console.warn(`[BLOOD_REQUEST_SECURITY]: User ${session.user.id} attempted to use PII in slug. Falling back to anonymous.`);
            }
        }

        // Generate unique slug using the determined base (uses custom if safe, else anonymous)
        const slug = await generateUniqueSlug(BloodRequest, finalBaseSlug);

        // Calculate expiry (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

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
