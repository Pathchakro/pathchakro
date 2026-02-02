import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReaderChapterListProps {
    chapters: any[];
    currentChapterId: string;
    bookSlug: string;
}

export function ReaderChapterList({ chapters, currentChapterId, bookSlug }: ReaderChapterListProps) {
    return (
        <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-2rem)] sticky top-8 border-l bg-background">
            <div className="p-4 font-semibold border-b">
                Table of Contents
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {chapters.map((chapter) => {
                        const chapterSlug = chapter.slug.split('/').pop();
                        const isActive = chapter._id === currentChapterId;

                        return (
                            <Link
                                key={chapter._id}
                                href={`/read/${bookSlug}/${chapterSlug}`}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-sm transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex gap-2">
                                    <span className="opacity-50 min-w-[1.5rem]">{chapter.chapterNumber}.</span>
                                    <span className="line-clamp-1">{chapter.title}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </ScrollArea>
        </aside>
    );
}
