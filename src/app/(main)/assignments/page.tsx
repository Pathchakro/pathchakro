import { auth } from '@/auth';
import { getCachedAssignments } from '@/lib/data/assignments';
import AssignmentsClient from '@/components/assignments/AssignmentsClient';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Assignments - Pathchakro',
    description: 'View and submit assignments for your courses and teams, and track your learning progress.',
};

export default async function AssignmentsPage() {
    const session = await auth();
    
    // 1. Authentication Guard
    if (!session || !session.user) {
        redirect('/api/auth/signin?callbackUrl=/assignments');
    }

    const userId = session.user.id;
    // 2. Derive role securely from session (default to student)
    const role = (session.user as any).role || 'student';

    let assignments = [];
    
    try {
        // 3. Securely fetch assignments with error boundary
        assignments = await getCachedAssignments({
            role,
            userId
        });
    } catch (error) {
        console.error('[ASSIGNMENTS_FETCH_ERROR]:', error);
        throw error; // Re-throw to trigger Next.js error boundary
    }

    return (
        <AssignmentsClient 
            initialAssignments={assignments} 
            session={session} 
        />
    );
}
