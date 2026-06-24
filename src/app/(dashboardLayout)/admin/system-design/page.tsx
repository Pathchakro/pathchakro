import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import SystemDesignClient from '@/components/admin/SystemDesignClient';

export const metadata: Metadata = {
  title: 'System Design & Trackings | Pathchakro',
  description: 'Manage tracking IDs, pixels, search consoles, and private admin records.',
};

export default async function SystemDesignPage() {
  const session = await auth();

  // Authorization check (Only allow admins)
  if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super-admin') {
    redirect('/');
  }

  await dbConnect();

  // Fetch the first config record
  const configData = await SystemConfig.findOne().sort({ updatedAt: -1 }).lean();

  // Serialize MongoDB object
  const initialConfig = configData ? JSON.parse(JSON.stringify(configData)) : {};

  return <SystemDesignClient initialConfig={initialConfig} />;
}
