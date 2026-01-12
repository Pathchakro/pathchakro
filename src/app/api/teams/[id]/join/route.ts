import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        // Check if already a member
        const isMember = team.members.some(
            (m: any) => m.user.toString() === userId
        );

        if (isMember) {
            return NextResponse.json(
                { error: 'Already a member of this team' },
                { status: 400 }
            );
        }

        // Check if already requested
        const hasRequested = team.joinRequests?.some(
            (r: any) => r.user.toString() === userId
        );

        if (hasRequested) {
            return NextResponse.json(
                { error: 'Join request already pending' },
                { status: 400 }
            );
        }

        if (team.privacy === 'public') {
            // Auto-join for public teams
            team.members.push({
                user: userId,
                role: 'member',
                joinedAt: new Date(),
            });
            await team.save();

            return NextResponse.json({
                message: 'Joined team successfully',
                joined: true,
            });
        } else {
            // Create join request for private teams
            if (!team.joinRequests) {
                team.joinRequests = [];
            }
            team.joinRequests.push({
                user: userId,
                requestedAt: new Date(),
            });
            await team.save();

            return NextResponse.json({
                message: 'Join request sent',
                requested: true,
            });
        }
    } catch (error: any) {
        console.error('Error joining team:', error);
        return NextResponse.json(
            { error: 'Failed to join team' },
            { status: 500 }
        );
    }
}
