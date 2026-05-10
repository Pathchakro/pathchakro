import { auth } from '@/auth';
import { getCachedUserWritingProjects } from '@/lib/data/writing';
import { PenTool, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WritingProjectCard } from '@/components/writing/WritingProjectCard';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'My Writing Projects - Pathchakro',
    description: 'Manage your books and writing projects on Pathchakro.',
};

export default async function WritingDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/writing');
    }

    // Cached Database Call
    const serializedProjects = await getCachedUserWritingProjects(session.user.id);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <PenTool className="h-8 w-8 text-purple-500" />
                            My Writing Projects
                        </h1>
                        <p className="text-muted-foreground">Create, manage, and publish your books</p>
                    </div>
                    <Link href="/writing/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Start Writing
                        </Button>
                    </Link>
                </div>
            </div>

            {serializedProjects.length === 0 ? (
                <div className="text-center py-12">
                    <PenTool className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No writing projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Start your first book today!
                    </p>
                    <Link href="/writing/new">
                        <Button>Start Writing</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {serializedProjects.map((project: any) => (
                        <WritingProjectCard
                            key={project._id}
                            project={project}
                            isOwnProfile={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
