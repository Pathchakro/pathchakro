import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const team = await Team.findById(params.id)
            .populate('leader', 'name image rankTier')
            .populate('members.user', 'name image rankTier')
            .lean();

        if (!team) {
            return NextResponse.json(
                { error: 'Team not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ team });
    } catch (error: any) {
        console.error('Error fetching team:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team' },
            { status: 500 }
        );
    }
}
