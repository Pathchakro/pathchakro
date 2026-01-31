import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const filterParam = searchParams.get('filter'); // 'mine', 'favorites', 'enrolled'

        let filter: any = {};

        const session = await auth();

        if (['mine', 'favorites', 'enrolled'].includes(filterParam || '')) {
            if (!session?.user?.id) {
                return NextResponse.json([]);
            }

            if (filterParam === 'mine') {
                // My courses: Created by me (instructor)
                filter = { instructor: session.user.id };
            } else if (filterParam === 'favorites') {
                const user = await User.findById(session.user.id).select('savedCourses');
                if (user?.savedCourses && user.savedCourses.length > 0) {
                    filter = { _id: { $in: user.savedCourses } };
                } else {
                    return NextResponse.json([]); // Return empty array if no favorites
                }
            } else if (filterParam === 'enrolled') {
                // Enrolled courses: User is in students array
                filter = { students: session.user.id };
            }
        }

        // Fetch courses and populate students to show count/avatars
        const courses = await Course.find(filter)
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

        revalidatePath('/', 'layout');

        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('Create Course Error:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}
