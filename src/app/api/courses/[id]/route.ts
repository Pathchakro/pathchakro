import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User'; // Ensure User model is registered

export const dynamic = 'force-dynamic';

// Helper to extract ID params
async function getCourse(id: string) {
    await dbConnect();
    return Course.findById(id)
        .populate('instructor', 'name image')
        .populate('students', 'name image');
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15+
) {
    try {
        const { id } = await params;
        const course = await getCourse(id);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('Fetch Course Error:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}
