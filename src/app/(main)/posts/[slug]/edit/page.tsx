'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import NovelEditor from '@/components/editor/NovelEditor';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react';
import { BOOK_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';

interface Post {
    _id: string;
    title: string;
    content: string;
    category: string;
    media: string[];
    privacy: string;
    author: {
        _id: string;
    };
}

export default function EditPostPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    // params.slug might be an array or string depending on setup, but typically string here
    const slug = params.slug as string;

    const [post, setPost] = useState<Post | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [category, setCategory] = useState(BOOK_CATEGORIES[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (slug) {
            fetchPost();
        }
    }, [slug]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`/api/posts/slug/${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Post not found");
                    router.push('/');
                }
                return;
            }

            const data = await response.json();
            if (data.post) {
                setPost(data.post);
                setTitle(data.post.title || '');
                // Handle content - check if it's JSON string or plain text
                try {
                    // Try parsing if it looks like JSON
                    const parsed = JSON.parse(data.post.content);
                    // If successful and looks like editor state, use stringified version for editor
                    setContent(JSON.stringify(parsed));
                } catch (e) {
                    // If regular string, wrap in paragraph structure if needed or just pass string
                    // NovelEditor might expect stringified JSON
                    // If it's old plain text, we might need to migrate or just set it
                    setContent(data.post.content);
                }

                setMediaUrls(data.post.media || []);
                setCategory(data.post.category || BOOK_CATEGORIES[0]);

                // Verify ownership
                if (session?.user?.id && data.post.author._id !== session.user.id) {
                    toast.error("You are not authorized to edit this post");
                    router.push('/');
                }
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            toast.error("Failed to load post");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mediaUrls.length >= 5) {
            toast.error("Maximum 5 posts allowed");
            return;
        }

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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        setMediaUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!post) return;

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!content.trim() && mediaUrls.length === 0) return;

        setIsSaving(true);

        try {
            // Use slug from URL params (which is already `slug`)
            // We need to use the new slug API endpoint
            const response = await fetch(`/api/posts/slug/${slug}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    privacy: 'public', // Keep public for now as per previous constraint
                    media: mediaUrls,
                }),
            });

            if (response.ok) {
                toast.success("Post updated!");
                router.push('/profile/me'); // Or go back to post detail if we had one
            } else {
                toast.error("Failed to update post");
            }
        } catch (error) {
            console.error('Error updating post:', error);
            toast.error("Error updating post");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 min-h-screen">
            <div className="mb-6">
                <Button variant="ghost" className="pl-0 gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold mt-2">Edit Post</h1>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                                {BOOK_CATEGORIES.map((cat) => (
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

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => router.back()}
                            disabled={isSaving || isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={(!content.trim() && mediaUrls.length === 0) || !title.trim() || isSaving || isUploading}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
