'use client';

import { EditorContent, EditorRoot, JSONContent } from 'novel';
import { defaultExtensions } from '@/components/editor/extensions';
import { slashCommand } from '@/components/editor/slash-command';

interface PostContentProps {
    content: string;
}

const extensions = [...defaultExtensions, slashCommand];

export const PostContent = ({ content }: PostContentProps) => {
    let initialContent: JSONContent | undefined;

    try {
        initialContent = JSON.parse(content);
    } catch (e) {
        // Fallback for plain text content
        initialContent = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: content,
                        },
                    ],
                },
            ],
        };
    }

    return (
        <EditorRoot>
            <EditorContent
                initialContent={initialContent}
                extensions={extensions as any}
                editable={false}
                editorProps={{
                    attributes: {
                        class: "prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full text-[16px]",
                    },
                }}
            />
        </EditorRoot>
    );
};
