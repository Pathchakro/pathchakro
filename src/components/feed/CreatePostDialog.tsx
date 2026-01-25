'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import NovelEditor from '@/components/editor/NovelEditor';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
// import { BOOK_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useEffect } from 'react';

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
    const { data: session } = useSession();
    const { categories } = useDynamicConfig();
    const { checkBasicAccess } = useAccessControl();

    useEffect(() => {
        if (open) {
            const allowed = checkBasicAccess(false);
            if (!allowed) {
                toast.error("Complete your profile (70%) to create posts.");
                onOpenChange(false);
            }
        }
    }, [open, checkBasicAccess, onOpenChange]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Set default category when loaded
    if (!category && categories.length > 0) {
        setCategory(categories[0]);
    }
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mediaUrls.length >= 5) {
            toast.error("Maximum 5 posts allowed");
            return;
        }

        // Check file size (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size too large (max 5MB)");
            return;
        }

        setIsUploading(true);
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: file
            });
            const data = await response.json();

            if (data.url) {
                setMediaUrls(prev => [...prev, data.url]);
                toast.success("Image uploaded!");
            } else {
                toast.error("Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Something went wrong");
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        setMediaUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!content.trim() && mediaUrls.length === 0) return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    type: mediaUrls.length > 0 ? 'photo' : 'text',
                    privacy: 'public',
                    media: mediaUrls,
                }),
            });

            if (response.ok) {
                setTitle('');
                setContent('');
                setMediaUrls([]);
                setContent('');
                setMediaUrls([]);
                setCategory(categories[0] || '');
                onOpenChange(false);
                toast.success("Post created!");
                // Trigger feed refresh
                window.location.reload();
            } else {
                toast.error("Failed to create post");
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error("Error creating post");
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
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1 text-xs h-7 w-fit bg-transparent border-none p-0 focus:ring-0 text-muted-foreground font-normal"
                            >
                                <option value="" disabled>Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Post Title"
                            className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <NovelEditor
                        initialValue={content ? JSON.parse(content) : undefined}
                        onChange={(val) => setContent(val)}
                    />

                    {/* Image Preview */}
                    {mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {mediaUrls.map((url, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden border bg-muted/50 aspect-video group">
                                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-0.5 text-center">
                                            Thumbnail
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading image...
                        </div>
                    )}

                    <div className="border rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">Add to your post</p>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || mediaUrls.length >= 5}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                <ImageIcon className="h-5 w-5 text-green-500" />
                                <span className="text-sm">Photo {mediaUrls.length}/5</span>
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={(!content.trim() && mediaUrls.length === 0) || !title.trim() || isLoading || isUploading}
                    >
                        {isLoading ? 'Posting...' : 'Post'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
