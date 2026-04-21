import { generateHtml } from '@/lib/server-html';

interface ChapterContentProps {
    content: string;
}

export function ChapterContent({ content }: ChapterContentProps) {

    const htmlContent = generateHtml(content);

    return (
        <div
            className="ProseMirror prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}
