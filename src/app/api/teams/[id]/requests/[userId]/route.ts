import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string; userId: string }> }
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

        const { action } = await request.json(); // 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
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

        // Check if user is team leader
        if (team.leader.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Only team leaders can approve join requests' },
                { status: 403 }
            );
        }

        const requestIndex = team.joinRequests?.findIndex(
            (r: any) => r.user.toString() === params.userId
        );

        if (requestIndex === undefined || requestIndex === -1) {
            return NextResponse.json(
                { error: 'Join request not found' },
                { status: 404 }
            );
        }

        if (action === 'approve') {
            // Add to members
            team.members.push({
                user: params.userId,
                role: 'member',
                joinedAt: new Date(),
            });

            // Remove from requests
            if (team.joinRequests) {
                team.joinRequests.splice(requestIndex, 1);
            }

            await team.save();

            return NextResponse.json({
                message: 'Join request approved',
                success: true,
            });
        } else {
            // Reject - remove the request
            if (team.joinRequests) {
                team.joinRequests.splice(requestIndex, 1);
            }
            await team.save();

            return NextResponse.json({
                message: 'Join request rejected',
                success: true,
            });
        }
    } catch (error: any) {
        console.error('Error managing join request:', error);
        return NextResponse.json(
            { error: 'Failed to manage join request' },
            { status: 500 }
        );
    }
}
