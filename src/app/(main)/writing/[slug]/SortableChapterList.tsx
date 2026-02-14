"use client";

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Eye,
    MoreVertical,
    Pencil,
    Trash2,
    GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Chapter {
    _id: string;
    chapterNumber: number;
    title: string;
    slug?: string;
    createdAt: string;
    wordCount: number;
    image?: string;
    status: string;
}

interface SortableChapterListProps {
    chapters: Chapter[];
    projectId: string; // or slug? The API handles either ID or Slug.
    projectSlug: string;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export function SortableChapterList({ chapters: initialChapters, projectId, projectSlug, onDelete }: SortableChapterListProps) {
    const [chapters, setChapters] = useState(initialChapters);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setChapters(initialChapters);
    }, [initialChapters]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        // useSensor(KeyboardSensor, {
        //     coordinateGetter: sortableKeyboardCoordinates,
        // }) // Keyboard support makes it accessible
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setChapters((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over?.id);

                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
                    return items;
                }

                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Trigger API Save
                saveOrder(newOrder);

                return newOrder;
            });
        }
    };

    const saveOrder = async (newOrder: Chapter[]) => {
        setIsSaving(true);
        const chapterIds = newOrder.map(c => c._id);

        try {
            const res = await fetch(`/api/writing/${projectId}/chapters/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterIds })
            });

            if (!res.ok) throw new Error('Failed to save order');

            toast.success('Chapter order updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save chapter order');
            // Revert state? Ideally yes, but lazy update for now.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={chapters.map(c => c._id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {chapters.map((chapter) => (
                        <SortableChapterItem
                            key={chapter._id}
                            chapter={chapter}
                            projectSlug={projectSlug}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

// Sub-component for individual item
function SortableChapterItem({ chapter, projectSlug, onDelete }: { chapter: Chapter, projectSlug: string, onDelete: (id: string, e: React.MouseEvent) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: chapter._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto', // Lift item when dragging
        position: isDragging ? 'relative' as const : undefined, // Ensure visible on top
    };

    const chapterSlugPart = chapter.slug ? chapter.slug.split('/').pop() : chapter._id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors ${isDragging ? 'shadow-lg border-primary/50 bg-accent/10' : ''}`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab hover:text-foreground text-muted-foreground p-1 rounded hover:bg-muted touch-none">
                    <GripVertical className="h-5 w-5" />
                </div>

                {chapter.image ? (
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0 hidden sm:block">
                        <Image
                            src={chapter.image}
                            alt={chapter.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="h-16 w-16 rounded-md bg-muted/50 flex items-center justify-center shrink-0 hidden sm:block">
                        <span className="text-2xl font-serif text-muted-foreground/30">{chapter.chapterNumber}</span>
                    </div>
                )}

                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Chapter {chapter.chapterNumber}</span>
                        {chapter.status === 'draft' && (
                            <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] font-medium uppercase tracking-wider">
                                Draft
                            </span>
                        )}
                    </div>
                    <Link
                        href={`/read/${projectSlug}/${chapterSlugPart}`}
                        className="block font-semibold text-lg hover:underline truncate group-hover:text-primary transition-colors"
                    >
                        {chapter.title}
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{formatDate(chapter.createdAt)}</span>
                        <span>•</span>
                        <span>{chapter.wordCount} words</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Link href={`/read/${projectSlug}/${chapterSlugPart}`}>
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={`/writing/${projectSlug}/chapters/${chapter._id}/edit`}>
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <Link href={`/read/${projectSlug}/${chapterSlugPart}`}>
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </DropdownMenuItem>
                        </Link>
                        <Link href={`/writing/${projectSlug}/chapters/${chapter._id}/edit`}>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                            onClick={(e) => onDelete(chapter._id, e)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
