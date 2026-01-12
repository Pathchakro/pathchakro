import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('q');

        let filter: any = {};

        if (type && type !== 'all') {
            filter.type = type;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const teams = await Team.find(filter)
            .populate('leader', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ teams });
    } catch (error: any) {
        console.error('Error fetching teams:', error);
        return NextResponse.json(
            { error: 'Failed to fetch teams' },
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
        const { name, description, type, privacy, university, location } = body;

        if (!name || !description || !type) {
            return NextResponse.json(
                { error: 'Name, description, and type are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const team = await Team.create({
            name,
            description,
            type,
            privacy: privacy || 'public',
            university: university || '',
            location: location || '',
            leader: session.user.id,
            members: [
                {
                    user: session.user.id,
                    role: 'leader',
                    joinedAt: new Date(),
                },
            ],
            joinRequests: [],
        });

        const populatedTeam = await Team.findById(team._id)
            .populate('leader', 'name image rankTier')
            .lean();

        return NextResponse.json(
            { team: populatedTeam },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating team:', error);
        return NextResponse.json(
            { error: 'Failed to create team' },
            { status: 500 }
        );
    }
}
