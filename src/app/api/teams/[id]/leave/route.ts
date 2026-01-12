import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const team = await Team.findById(params.id);

        if (!team) {
            return NextResponse.json(
                { error: 'Team not found' },
                { status: 404 }
            );
        }

        const userId = session.user.id;

        // Check if member
        const memberIndex = team.members.findIndex(
            (m: any) => m.user.toString() === userId
        );

        if (memberIndex === -1) {
            return NextResponse.json(
                { error: 'Not a member of this team' },
                { status: 400 }
            );
        }

        // Check if leader
        if (team.leader.toString() === userId) {
            return NextResponse.json(
                { error: 'Team leader cannot leave the team' },
                { status: 400 }
            );
        }

        // Remove member
        team.members.splice(memberIndex, 1);
        await team.save();

        return NextResponse.json({
            message: 'Left team successfully',
        });
    } catch (error: any) {
        console.error('Error leaving team:', error);
        return NextResponse.json(
            { error: 'Failed to leave team' },
            { status: 500 }
        );
    }
}
