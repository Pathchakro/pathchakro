import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let filter: any = {};

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (year) filter.year = parseInt(year);
        if (month) filter.month = parseInt(month);

        const contests = await Contest.find(filter)
            .populate('submissions.user', 'name image rankTier')
            .populate('winners.first.user', 'name image rankTier')
            .populate('winners.second.user', 'name image rankTier')
            .populate('winners.third.user', 'name image rankTier')
            .sort({ year: -1, month: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ contests });
    } catch (error: any) {
        console.error('Error fetching contests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contests' },
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

        // Only admins can create contests
        if ((session.user as any).role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            title,
            description,
            category,
            month,
            year,
            startDate,
            endDate,
            prize,
            slug: customSlug,
        } = body;

        if (!title || !description || !category || !month || !year || !startDate || !endDate || !prize) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Robust customSlug validation and sanitization
        let validatedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile', 'contests', 'winners'].includes(trimmed);
            
            if (trimmed.length >= 3 && trimmed.length <= 64 && isValidPattern && !isReserved) {
                validatedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 3-64 characters, lowercase letters, numbers, and hyphens. No reserved words.' },
                    { status: 400 }
                );
            }
        }

        // Generate unique slug from validated input or title fallback
        const slug = await generateUniqueSlug(Contest, validatedSlug || title);

        const contest = await Contest.create({
            title,
            slug,
            description,
            category,
            month,
            year,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: new Date() < new Date(startDate) ? 'upcoming' : 'active',
            prize,
            submissions: [],
            winners: {},
        });

        return NextResponse.json(
            { contest },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating contest:', error);
        return NextResponse.json(
            { error: 'Failed to create contest' },
            { status: 500 }
        );
    }
}
