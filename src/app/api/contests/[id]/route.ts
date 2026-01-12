import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Contest from '@/models/Contest';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const contest = await Contest.findById(params.id)
            .populate('submissions.user', 'name image rankTier')
            .populate('winners.first.user', 'name image rankTier')
            .populate('winners.second.user', 'name image rankTier')
            .populate('winners.third.user', 'name image rankTier')
            .lean();

        if (!contest) {
            return NextResponse.json(
                { error: 'Contest not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ contest });
    } catch (error: any) {
        console.error('Error fetching contest:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contest' },
            { status: 500 }
        );
    }
}
