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

        // Only admins can create contests (you can add admin check here)

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
        } = body;

        if (!title || !description || !category || !month || !year || !startDate || !endDate || !prize) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        const slug = await generateUniqueSlug(Contest, title);

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
