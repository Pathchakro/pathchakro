import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        // Fetch courses and populate students to show count/avatars
        const courses = await Course.find({})
            .populate('instructor', 'name image')
            .populate('students', 'name image') // Limit this if too many students
            .sort({ createdAt: -1 });

        return NextResponse.json(courses);
    } catch (error) {
        console.error('Fetch Courses Error:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        // Basic validation
        if (!data.title || !data.fee) {
            return NextResponse.json({ error: 'Title and Fee are required' }, { status: 400 });
        }

        let slug = slugify(data.title, { lower: true, strict: true });

        // Ensure uniqueness
        let counter = 1;
        while (await Course.findOne({ slug })) {
            slug = `${slugify(data.title, { lower: true, strict: true })}-${counter}`;
            counter++;
        }

        const course = await Course.create({
            ...data,
            slug,
            instructor: session.user.id,
            students: []
        });

        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('Create Course Error:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}
