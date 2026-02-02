import { BookCover } from '@/components/books/BookCover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, FileText } from 'lucide-react';

interface ReaderInfoSidebarProps {
    project: any; // Type accurately if possible
}

export function ReaderInfoSidebar({ project }: ReaderInfoSidebarProps) {
    return (
        <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-2rem)] sticky top-8 gap-6 p-4 border-r overflow-y-auto">
            <div className="space-y-4 text-center">
                <div className="w-32 mx-auto shadow-lg rounded-md overflow-hidden relative aspect-[2/3]">
                    <BookCover src={project.coverImage} alt={project.title} />
                </div>

                <div>
                    <h2 className="font-bold text-lg leading-tight mb-1">{project.title}</h2>
                    <p className="text-sm text-muted-foreground">{project.category?.join(', ')}</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={project.author?.image} />
                        <AvatarFallback>{project.author?.name?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{project.author?.name}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="p-2 bg-muted/50 rounded-lg">
                    <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <span className="font-bold block">{project.chapters?.length || 0}</span>
                    <span className="text-xs text-muted-foreground">Chapters</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <span className="font-bold block">{Math.ceil((project.totalWords || 0) / 250)}</span>
                    <span className="text-xs text-muted-foreground">Pages</span>
                </div>
            </div>

            {project.introduction && (
                <div className="text-sm text-muted-foreground leading-relaxed px-2">
                    <p className="line-clamp-6">{project.introduction}</p>
                </div>
            )}
        </aside>
    );
}
