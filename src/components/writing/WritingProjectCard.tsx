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

interface ChapterFeedItem {
    _id: string; // Chapter ID
    type: 'chapter';
    bookId: string;
    title: string; // Book Title
    slug?: string; // Book Slug
    coverImage?: string;
    author: {
        _id: string;
        name: string;
        image?: string;
    };
    chapterTitle: string;
    chapterNumber: number;
    chapterSlug: string;
    createdAt: string;
    category: string[];
    totalWords: number;
    totalChapters: number;
}

interface WritingProjectCardProps {
    project: WritingProject | ChapterFeedItem;
    isOwnProfile?: boolean;
}

export function WritingProjectCard({ project, isOwnProfile }: WritingProjectCardProps) {
    const { data: session } = useSession();

    const isChapter = (item: any): item is ChapterFeedItem => {
        return item.type === 'chapter';
    };

    const chapterItem = isChapter(project) ? project : null;
    // Normalized data
    const coverImage = chapterItem ? chapterItem.coverImage : (project as WritingProject).coverImage;
    const bookTitle = chapterItem ? chapterItem.title : (project as WritingProject).title;
    const author = chapterItem ? chapterItem.author : (project as WritingProject).author;
    const bookSlug = chapterItem ? chapterItem.slug || chapterItem.bookId : (project as WritingProject).slug || (project as WritingProject)._id;
    const readLink = chapterItem
        ? `/read/${bookSlug}/${chapterItem.chapterSlug}`
        : `/writing/${bookSlug}`;

    // For regular project card, we use project details. For chapter card, strict "Chapter X: title" format isn't requested broadly but implicit in "clickable chapter name with book name"
    // User requested: "chapter card contain clickable chapter name with book name"

    const displayTitle = chapterItem
        ? `${chapterItem.title}`
        : (project as WritingProject).title;

    const chapterLink = chapterItem ? `/read/${bookSlug}/${chapterItem.chapterSlug}` : null;

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
                    <BookCover src={coverImage} alt={bookTitle} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            {chapterItem ? (
                                <div className="space-y-1">
                                    <Link href={readLink} className="hover:underline">
                                        <h3 className="font-bold text-lg line-clamp-1">{bookTitle}</h3>
                                    </Link>
                                    <Link href={chapterLink!} className="block w-fit">
                                        <h4 className="font-medium text-base text-primary hover:underline line-clamp-1">
                                            Chapter {chapterItem.chapterNumber}: {chapterItem.chapterTitle}
                                        </h4>
                                    </Link>
                                    {author && (
                                        <p className="text-xs text-muted-foreground">by {author.name}</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link href={readLink} className="hover:underline">
                                        <h3 className="font-bold text-lg line-clamp-1 mb-1">{bookTitle}</h3>
                                    </Link>
                                    {author && (
                                        <p className="text-xs text-muted-foreground">by {author.name}</p>
                                    )}
                                </>
                            )}
                        </div>

                        {!chapterItem && isOwnProfile && (
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

                    {!chapterItem && project.description && (
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
                    {/* For chapter items, we typically don't show the full book description, or maybe just the chapter title is enough context */}
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    {/* Visibility only relevant for project management view usually, but good to keep consistency if needed. 
                       For public feed, it's always public. */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border 
                        ${chapterItem ? 'border-blue-200 text-blue-700 bg-blue-50' : (project.visibility === 'public' ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-700 bg-gray-50')}`}>
                        {chapterItem ? 'Chapter' : (project.visibility === 'public' ? 'Public' : 'Private')}
                    </span>

                    <Link href={readLink}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            {isOwnProfile ? 'Manage Project' : (chapterItem ? 'Read Chapter' : 'Read Now')}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
