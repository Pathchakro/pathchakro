'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, Plus, BookOpen, Eye, EyeOff, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { WritingProjectCard } from '@/components/writing/WritingProjectCard';

interface WritingProject {
    _id: string;
    title: string;
    slug?: string;
    coverImage?: string;
    description?: string;
    author: any;
    category: string[];
    status: 'draft' | 'published';
    visibility: 'private' | 'public';
    totalWords: number;
    totalChapters: number;
    forSale: boolean;
    updatedAt: string;
}

export default function WritingDashboardPage() {
    const [projects, setProjects] = useState<WritingProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/writing?mine=true');
            const data = await response.json();

            if (data.projects) {
                setProjects(data.projects);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

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

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading projects...
                </div>
            ) : projects.length === 0 ? (
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
                    {projects.map((project) => (
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
