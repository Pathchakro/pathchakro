import { generateHtml } from '@/lib/server-html';

interface CourseDescriptionProps {
    description: string;
}

export function CourseDescription({ description }: CourseDescriptionProps) {
    const htmlContent = generateHtml(description);

    if (!htmlContent) {
        return (
            <div className="bg-card p-6 rounded-lg border">
                <p className="whitespace-pre-wrap text-muted-foreground">{description}</p>
            </div>
        );
    }

    return (
        <div
            className="ProseMirror prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}
