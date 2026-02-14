import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const params = await props.params;
        await dbConnect();

        const { slug } = params;
        let assignment;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            assignment = await Assignment.findById(slug)
                .populate('teacher', 'name image rankTier')
                .populate('team', 'name')
                .populate('submissions.student', 'name image rankTier')
                .lean();
        }

        if (!assignment) {
            assignment = await Assignment.findOne({ slug })
                .populate('teacher', 'name image rankTier')
                .populate('team', 'name')
                .populate('submissions.student', 'name image rankTier')
                .lean();
        }

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
