/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;

    // Remove whitespace
    url = url.trim();

    // Regular YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    let match = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Short YouTube URL: https://youtu.be/VIDEO_ID
    match = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    match = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // If it's just the video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Validate if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
    return getYouTubeVideoId(url) !== null;
}
