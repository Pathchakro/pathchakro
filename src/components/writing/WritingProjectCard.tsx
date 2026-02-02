'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Edit, BookOpen, Clock, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { BookCover } from '../books/BookCover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from '@/lib/utils';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface WritingProject {
    _id: string;
    title: string;
    slug?: string;
    coverImage?: string;
    description?: string;
    author: {
        _id: string;
        name: string;
        image?: string;
    };
    category: string[];
    status: 'draft' | 'published';
    visibility: 'private' | 'public';
    totalWords: number;
    totalChapters: number;
    updatedAt: string;
}

interface WritingProjectCardProps {
    project: WritingProject;
    isOwnProfile?: boolean;
}

export function WritingProjectCard({ project, isOwnProfile }: WritingProjectCardProps) {
    const { data: session } = useSession();

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/writing/${project._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete project');
            }

            toast.success('Project deleted successfully');
            window.location.reload();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete project');
        }
    };

    return (
        <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col md:flex-row w-full group">
            {/* Book Cover */}
            <div className="relative w-full md:w-40 h-56 md:h-auto shrink-0 bg-muted p-4 flex items-center justify-center">
                <div className="relative w-full h-full shadow-sm rounded-sm overflow-hidden">
                    <BookCover src={project.coverImage} alt={project.title} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <Link href={`/writing/${project.slug || project._id}`} className="hover:underline">
                                <h3 className="font-bold text-lg line-clamp-1 mb-1">{project.title}</h3>
                            </Link>
                            {project.author && (
                                <p className="text-xs text-muted-foreground">by {project.author.name}</p>
                            )}
                        </div>

                        {isOwnProfile && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/writing/${project.slug || project._id}`} className="flex w-full cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{project.totalChapters} Chapters</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{project.totalWords.toLocaleString()} Words</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Updated {formatDate(project.updatedAt)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                        {project.category.map((cat) => (
                            <span key={cat} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                                {cat}
                            </span>
                        ))}
                    </div>

                    {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {(() => {
                                try {
                                    if (project.description.trim().startsWith('{')) {
                                        const parsed = JSON.parse(project.description);
                                        // Simple extraction for Tiptap JSON schema
                                        if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
                                            return parsed.content.map((node: any) => node.content?.map((text: any) => text.text).join('')).join(' ') || project.description;
                                        }
                                    }
                                    return project.description;
                                } catch (e) {
                                    return project.description;
                                }
                            })()}
                        </p>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border 
                        ${project.visibility === 'public' ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-700 bg-gray-50'}`}>
                        {project.visibility === 'public' ? 'Public' : 'Private'}
                    </span>

                    <Link href={`/writing/${project.slug || project._id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            {isOwnProfile ? 'Manage Project' : 'Read Now'}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
