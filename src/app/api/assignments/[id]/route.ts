import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        const assignment = await Assignment.findById(params.id)
            .populate('teacher', 'name image rankTier')
            .populate('team', 'name')
            .populate('submissions.student', 'name image rankTier')
            .lean();

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ assignment });
    } catch (error: any) {
        console.error('Error fetching assignment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assignment' },
            { status: 500 }
        );
    }
}
