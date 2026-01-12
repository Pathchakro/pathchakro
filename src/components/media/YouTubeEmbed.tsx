'use client';

import { getYouTubeVideoId } from '@/lib/youtube';

interface YouTubeEmbedProps {
    url: string;
    title?: string;
}

export function YouTubeEmbed({ url, title = 'YouTube video' }: YouTubeEmbedProps) {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
        return (
            <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground">
                Invalid YouTube URL
            </div>
        );
    }

    return (
        <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
