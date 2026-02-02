"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Map, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { useReaderUI } from './ReaderContext';

interface Chapter {
    _id: string;
    chapterNumber: number;
    title: string;
    slug: string;
}

interface ReaderNavigationProps {
    projectId: string;
    projectSlug: string; // The specific slug used in URL
    chapters: Chapter[];
    currentChapterId: string;
}

export function ReaderNavigation({ projectId, projectSlug, chapters, currentChapterId }: ReaderNavigationProps) {
    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { showUI } = useReaderUI();

    const currentChapterIndex = chapters.findIndex(c => c._id === currentChapterId);

    let prevChapter = null;
    let nextChapter = null;

    if (currentChapterIndex !== -1) {
        prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
        nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;
    }

    useEffect(() => {
        const controller = new AbortController();
        fetchProgress(controller);
        return () => controller.abort();
    }, [projectId]);

    const fetchProgress = async (controller: AbortController) => {
        try {
            const res = await fetch(`/api/writing/${projectId}/progress`, {
                signal: controller.signal
            });

            if (!res.ok) {
                console.error(`Error fetching progress: ${res.status} ${res.statusText}`);
                return;
            }

            const data = await res.json();
            if (data.completedChapters) {
                setCompletedChapters(data.completedChapters);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching progress:', error);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    const toggleComplete = async () => {
        // Toggle optimistic
        const isComplete = completedChapters.includes(currentChapterId);
        const newStatus = !isComplete;

        const originalCompleted = [...completedChapters];

        if (newStatus) {
            setCompletedChapters(prev => [...prev, currentChapterId]);
            toast.success('Chapter marked as completed');
        } else {
            setCompletedChapters(prev => prev.filter(id => id !== currentChapterId));
            toast.info('Chapter marked as incomplete');
        }

        try {
            const res = await fetch(`/api/writing/${projectId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId: currentChapterId,
                    action: newStatus ? 'complete' : 'incomplete',
                    currentChapterId // Also updates last read
                })
            });

            if (!res.ok) {
                setCompletedChapters(originalCompleted);
                toast.error('Failed to update progress');
            }
        } catch (error) {
            setCompletedChapters(originalCompleted);
            toast.error('Connection error');
        }
    };

    // Helper to get chapter link
    const getChapterLink = (chapter: Chapter) => {
        const chapterSlugPart = chapter.slug.split('/').pop();
        return `/read/${projectSlug}/${chapterSlugPart}`;
    };

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 z-40 transition-transform duration-300",
            !showUI && "translate-y-full"
        )}>
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

                {/* Previous Button */}
                <div className="flex-1">
                    {prevChapter ? (
                        <Link href={getChapterLink(prevChapter)}>
                            <Button variant="ghost" size="sm" className="gap-1 pl-1">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Prev: {prevChapter.chapterNumber}</span>
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="ghost" size="sm" disabled className="invisible">Prev</Button>
                    )}
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={completedChapters.includes(currentChapterId) ? "secondary" : "outline"}
                        size="sm"
                        onClick={toggleComplete}
                        className={cn("gap-2", completedChapters.includes(currentChapterId) && "text-green-600 bg-green-50 hover:bg-green-100")}
                    >
                        {completedChapters.includes(currentChapterId) ? (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Completed</span>
                            </>
                        ) : (
                            <>
                                <Circle className="h-4 w-4" />
                                <span className="hidden sm:inline">Mark Complete</span>
                            </>
                        )}
                    </Button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Table of Contents</SheetTitle>
                                <SheetDescription>
                                    {completedChapters.length} of {chapters.length} chapters completed
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-1">
                                {chapters.map((chapter) => (
                                    <Link key={chapter._id} href={getChapterLink(chapter)}>
                                        <div className={cn(
                                            "flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors text-sm",
                                            chapter._id === currentChapterId && "bg-muted font-medium",
                                            completedChapters.includes(chapter._id) && "text-muted-foreground"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground w-6">{chapter.chapterNumber}.</span>
                                                <span className="truncate max-w-[180px]">{chapter.title}</span>
                                            </div>
                                            {completedChapters.includes(chapter._id) && (
                                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Next Button */}
                <div className="flex-1 flex justify-end">
                    {nextChapter ? (
                        <Link href={getChapterLink(nextChapter)}>
                            <Button variant="ghost" size="sm" className="gap-1 pr-1">
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="ghost" size="sm" disabled className="invisible">Next</Button>
                    )}
                </div>
            </div>
        </div>
    );
}
