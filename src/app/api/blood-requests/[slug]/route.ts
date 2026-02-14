import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const { slug } = params;
        let bloodRequest;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            bloodRequest = await BloodRequest.findById(slug)
                .populate('requester', 'name image university thana rankTier')
                .lean();
        }

        if (!bloodRequest) {
            bloodRequest = await BloodRequest.findOne({ slug })
                .populate('requester', 'name image university thana rankTier')
                .lean();
        }

        if (!bloodRequest) {
            return NextResponse.json(
                { error: 'Blood request not found' },
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
    props: { params: Promise<{ slug: string }> }
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

        const body = await request.json();
        const { status, unitsNeeded, contactNumber, additionalInfo } = body;

        await dbConnect();

        const { slug } = params;
        let bloodRequest;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            bloodRequest = await BloodRequest.findById(slug);
        }

        if (!bloodRequest) {
            bloodRequest = await BloodRequest.findOne({ slug });
        }

        if (!bloodRequest) {
            return NextResponse.json(
                { error: 'Blood request not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (bloodRequest.requester.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        if (status !== undefined) bloodRequest.status = status;
        if (unitsNeeded !== undefined) bloodRequest.unitsNeeded = unitsNeeded;
        if (contactNumber !== undefined) bloodRequest.contactNumber = contactNumber;
        if (additionalInfo !== undefined) bloodRequest.additionalInfo = additionalInfo;

        await bloodRequest.save();

        return NextResponse.json({
            request: bloodRequest,
            message: 'Blood request updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating blood request:', error);
        return NextResponse.json(
            { error: 'Failed to update blood request' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
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

        const { slug } = params;
        let bloodRequest;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            bloodRequest = await BloodRequest.findById(slug);
        }

        if (!bloodRequest) {
            bloodRequest = await BloodRequest.findOne({ slug });
        }

        if (!bloodRequest) {
            return NextResponse.json(
                { error: 'Blood request not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (bloodRequest.requester.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        await BloodRequest.findByIdAndDelete(bloodRequest._id);

        return NextResponse.json({
            message: 'Blood request deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting blood request:', error);
        return NextResponse.json(
            { error: 'Failed to delete blood request' },
            { status: 500 }
        );
    }
}
