import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // Max requests per window per IP
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] || (request as any).ip || 'unknown';
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    // Clean up old entries occasionally (simple check to prevent memory leak logic for now)
    if (rateLimitMap.size > 10000) {
        rateLimitMap.clear();
    }

    if (!record) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
        return false;
    }

    if (now - record.lastReset > RATE_LIMIT_WINDOW) {
        record.count = 1;
        record.lastReset = now;
        rateLimitMap.set(ip, record);
        return false;
    }

    if (record.count >= MAX_REQUESTS) {
        return true;
    }

    record.count++;
    return false;
}

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        if (checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
        }

        await dbConnect();

        // Check authentication
        const session = await auth();
        const isAuthenticated = !!session?.user;

        const { searchParams } = new URL(request.url);
        const bloodGroup = searchParams.get('bloodGroup');
        const district = searchParams.get('district');
        const thana = searchParams.get('thana');

        const filter: any = {
            // Only show users who have a blood group set AND are willing to donate
            bloodGroup: { $in: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
            willingToDonateBlood: true
        };

        const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

        if (bloodGroup && bloodGroup !== 'all') {
            if (!ALLOWED_BLOOD_GROUPS.includes(bloodGroup)) {
                return NextResponse.json(
                    { error: `Invalid blood group. Allowed values are: ${ALLOWED_BLOOD_GROUPS.join(', ')}` },
                    { status: 400 }
                );
            }
            filter.bloodGroup = bloodGroup;
        }

        if (district && district !== 'all') {
            filter['address.present.district'] = district;
        }

        if (thana && thana !== 'all') {
            filter['address.present.thana'] = thana;
        }

        // Define projection fields
        // Base fields always available
        let projection = 'name image bloodGroup address willingToDonateBlood lastDateOfDonateBlood rankTier username title';

        // Add sensitive fields only if authenticated
        // The user request mentioned masking, but omitting is safer and easier for valid JSON.
        // If the frontend expects these keys to exist even if empty, we might need middleware to mask them, 
        // but typically omitting them is standard practice for unauthorized data.
        if (isAuthenticated) {
            projection += ' email whatsappNumber phone';
        }

        const users = await User.find(filter)
            .select(projection)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Error fetching blood bank users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
