'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import NovelEditor from '@/components/editor/NovelEditor';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Video, X } from 'lucide-react';
import { isValidYouTubeUrl } from '@/lib/youtube';
import { BOOK_CATEGORIES } from '@/lib/constants';

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
    const { data: session } = useSession();
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [isLoading, setIsLoading] = useState(false);
    const [showVideoInput, setShowVideoInput] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) return;

        if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
            alert('Please enter a valid YouTube URL');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    type: videoUrl ? 'video' : 'text',
                    privacy,
                    videoUrl: videoUrl || undefined,
                }),
            });

            if (response.ok) {
                setContent('');
                setVideoUrl('');
                setPrivacy('public');
                setShowVideoInput(false);
                onOpenChange(false);
                // Trigger feed refresh
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-start gap-3">
                        {session?.user?.image ? (
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                {session?.user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-semibold">{session?.user?.name || 'User Name'}</p>
                            <Select
                                value={privacy}
                                onChange={(e) => setPrivacy(e.target.value)}
                                className="mt-1 text-xs h-7"
                            >
                                {BOOK_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <NovelEditor
                        initialValue={content ? JSON.parse(content) : undefined}
                        onChange={(val) => setContent(val)}
                    />

                    {showVideoInput && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="videoUrl">YouTube Video URL</Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowVideoInput(false);
                                        setVideoUrl('');
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <Input
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            {videoUrl && !isValidYouTubeUrl(videoUrl) && (
                                <p className="text-xs text-red-500">Please enter a valid YouTube URL</p>
                            )}
                        </div>
                    )}

                    <div className="border rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">Add to your post</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <Image className="h-5 w-5 text-green-500" />
                                <span className="text-sm">Photo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowVideoInput(!showVideoInput)}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors ${showVideoInput ? 'bg-muted' : ''}`}
                            >
                                <Video className="h-5 w-5 text-red-500" />
                                <span className="text-sm">Video</span>
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!content.trim() || isLoading}
                    >
                        {isLoading ? 'Posting...' : 'Post'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
