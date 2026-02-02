'use client';

import NovelEditor from '@/components/editor/NovelEditor';
import { useMemo } from 'react';

export function ChapterContent({ content }: { content: string }) {

    // Parse JSON safely
    const initialValue = useMemo(() => {
        try {
            return content ? JSON.parse(content) : undefined;
        } catch (e) {
            return undefined;
        }
    }, [content]);

    if (!initialValue) return <div className="whitespace-pre-wrap">{content}</div>;

    return (
        <div className="pointer-events-none select-text">
            {/* 
                We use NovelEditor but interaction is disabled via pointer-events (except selection).
                Ideally NovelEditor accepts a `readonly` prop. 
                I will update NovelEditor to accept `readOnly` in a separate step if needed.
                For now, `pointer-events-none` is a quick hack for "readonly" appearance, 
                but basic text selection `select-text` helps.
            */}
            <NovelEditor
                initialValue={initialValue}
                onChange={() => { }}
                readOnly={true} // specific feature I'll add
            />
        </div>
    );
}
