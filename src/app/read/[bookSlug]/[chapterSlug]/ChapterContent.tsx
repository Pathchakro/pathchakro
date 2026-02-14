import { generateHtml } from '@/lib/server-html';

interface ChapterContentProps {
    content: string;
}

export function ChapterContent({ content }: ChapterContentProps) {

    const htmlContent = generateHtml(content);

    return (
        <div
            className="prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full text-[18px] md:text-[20px]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}
