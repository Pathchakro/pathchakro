import { getCachedCourses } from '@/lib/data/courses';
import CoursesClient from '@/components/courses/CoursesClient';
import { auth } from '@/auth';

export const metadata = {
    title: 'Browse Courses - Pathchakro',
    description: 'Explore our latest educational courses, workshops, and learning opportunities.',
};

export default async function CoursesPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const userId = session?.user?.id;

    const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined;

    // Direct database call with unstable_cache
    const courses = await getCachedCourses({
        search: q,
        filter,
        userId
    });

    return <CoursesClient initialCourses={courses} />;
}
