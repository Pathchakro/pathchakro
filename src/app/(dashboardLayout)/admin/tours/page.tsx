import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import AdminToursClient from '@/components/admin/AdminToursClient';

export const metadata: Metadata = {
    title: 'Manage Tours | Pathchakro',
    description: 'Admin interface to manage tours and confirm participants.',
};

export default async function AdminToursPage() {
    const session = await auth();

    // Authorization check
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super-admin') {
        redirect('/');
    }

    await dbConnect();

    // Fetch tours from database
    const toursData = await Tour.find({})
        .populate('organizer', 'name image')
        .populate('participants.user', 'name image')
        .sort({ createdAt: -1 })
        .lean();

    // Serialize MongoDB objects for the Client Component
    const tours = JSON.parse(JSON.stringify(toursData));

    return <AdminToursClient initialTours={tours} />;
}
