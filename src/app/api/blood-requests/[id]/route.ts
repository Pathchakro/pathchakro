import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';

export async function GET(
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

        const bloodRequest = await BloodRequest.findOne({
            _id: params.id,
            requester: session.user.id,
        });

        if (!bloodRequest) {
            return NextResponse.json(
                { error: 'Blood request not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ request: bloodRequest });
    } catch (error: any) {
        console.error('Error fetching blood request:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blood request' },
            { status: 500 }
        );
    }
}

export async function PUT(
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

        const { status } = await request.json();

        if (!['fulfilled', 'expired'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        await dbConnect();

        const bloodRequest = await BloodRequest.findOneAndUpdate(
            { _id: params.id, requester: session.user.id },
            { status },
            { new: true }
        );

        if (!bloodRequest) {
            return NextResponse.json(
                { error: 'Blood request not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ request: bloodRequest });
    } catch (error: any) {
        console.error('Error updating blood request:', error);
        return NextResponse.json(
            { error: 'Failed to update blood request' },
            { status: 500 }
        );
    }
}
