'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { WritingProjectCard } from '@/components/writing/WritingProjectCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MyBooksTabContentProps {
    userId: string;
    isOwnProfile: boolean;
}

export function MyBooksTabContent({ userId, isOwnProfile }: MyBooksTabContentProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, [userId]);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`/api/writing?author=${userId}`);
            const data = await response.json();
            if (data.projects) {
                // Attach debug info to the array for display purposes (hacky but effective for debugging)
                const projectsWithDebug = data.projects;
                (projectsWithDebug as any).debug = data.debug;
                setProjects(projectsWithDebug);
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error('Error fetching writing projects:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="bg-card rounded-lg p-8 text-center border shadow-sm">
                <h3 className="text-xl font-semibold mb-2">No Books Found</h3>
                <p className="text-muted-foreground mb-6">
                    {isOwnProfile
                        ? "You haven't written any books yet."
                        : "This user hasn't published any books yet."}
                </p>

                {/* DEBUG INFO */}
                <div className="mt-4 p-4 bg-muted/50 rounded text-left text-xs font-mono mb-4 overflow-auto max-h-40">
                    <p><strong>Debug Info:</strong></p>
                    <p>Tab User ID: {userId}</p>

                    <pre>{JSON.stringify((projects as any)?.debug || "No API debug info", null, 2)}</pre>
                </div>

                {isOwnProfile && (
                    <Link href="/writing/new">
                        <Button>Start Writing a Book</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {isOwnProfile && (
                <div className="flex justify-end mb-4">
                    <Link href="/writing/new">
                        <Button>Write New Book</Button>
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                    <WritingProjectCard
                        key={project._id}
                        project={project}
                        isOwnProfile={isOwnProfile}
                    />
                ))}
            </div>
        </div>
    );
}
