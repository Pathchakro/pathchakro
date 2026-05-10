import { auth } from '@/auth';
import { getCachedAssignmentById } from '@/lib/data/assignments';
import AssignmentDetailClient from '@/components/assignments/AssignmentDetailClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const assignment = await getCachedAssignmentById(params.slug);
    if (!assignment) return { title: 'Assignment Not Found' };

    return {
        title: `${assignment.title} | Assignments - Pathchakro`,
        description: assignment.description,
    };
}

export default async function AssignmentDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const session = await auth();
    
    // Direct database call with unstable_cache
    const assignment = await getCachedAssignmentById(params.slug);

    if (!assignment) {
        notFound();
    }

    return (
        <AssignmentDetailClient 
            initialAssignment={assignment} 
            session={session} 
        />
    );
}
