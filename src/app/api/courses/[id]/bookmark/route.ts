import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import mongoose from 'mongoose';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        await dbConnect();

        // Check if course exists
        let course;

        if (mongoose.Types.ObjectId.isValid(id)) {
            course = await Course.findById(id);
        }

        if (!course) {
            // Try searching by slug
            course = await Course.findOne({ slug: id });
        }

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const courseIdStr = course._id.toString();

        // Ensure savedCourses is initialized
        if (!user.savedCourses) {
            user.savedCourses = [];
        }

        const isBookmarked = user.savedCourses.some(
            (savedId: any) => savedId.toString() === courseIdStr
        );

        if (isBookmarked) {
            // Remove from bookmarks
            user.savedCourses = user.savedCourses.filter(
                (savedId: any) => savedId.toString() !== courseIdStr
            ) as any;
        } else {
            // Add to bookmarks
            user.savedCourses.push(course._id as any);
        }

        await user.save();

        return NextResponse.json({
            isBookmarked: !isBookmarked,
            savedCourses: user.savedCourses
        });

    } catch (error: any) {
        console.error('Error toggling course bookmark:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
