import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import AdminCoursesClient from '@/components/admin/AdminCoursesClient';

export const metadata: Metadata = {
    title: 'Manage Courses | Pathchakro',
    description: 'Admin interface to view and manage courses and enrolled students.',
};

export default async function AdminCoursesPage() {
    const session = await auth();

    // Authorization check
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super-admin') {
        redirect('/');
    }

    await dbConnect();

    // Fetch courses from database
    const coursesData = await Course.find({})
        .populate('instructor', 'name image')
        .populate('students', 'name email image')
        .sort({ createdAt: -1 })
        .lean();

    // Serialize MongoDB objects for the Client Component
    const courses = JSON.parse(JSON.stringify(coursesData));

    return <AdminCoursesClient initialCourses={courses} />;
}
