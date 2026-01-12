'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, Plus, BookOpen, Eye, EyeOff, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface WritingProject {
    _id: string;
    title: string;
    coverImage?: string;
    status: string;
    visibility: string;
    totalChapters: number;
    totalWords: number;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <Link
                            key={project._id}
                            href={`/writing/${project._id}`}
                            className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'published'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {project.status.toUpperCase()}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            {project.visibility === 'public' ? (
                                                <><Eye className="h-3 w-3" /> Public</>
                                            ) : (
                                                <><EyeOff className="h-3 w-3" /> Private</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground mb-3">
                                <p className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    {project.totalChapters} chapters • {project.totalWords.toLocaleString()} words
                                </p>
                                {project.forSale && (
                                    <p className="flex items-center gap-1 text-green-600">
                                        <DollarSign className="h-4 w-4" />
                                        For Sale
                                    </p>
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
