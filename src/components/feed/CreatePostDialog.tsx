'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import NovelEditor from '@/components/editor/NovelEditor';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';
import { LoginModal } from '@/components/auth/LoginModal';
import { slugify } from '@/lib/utils';

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
    const { data: session } = useSession();
    const { categories } = useDynamicConfig();
    const { checkAuth, showProfileModal, setShowProfileModal, showLoginModal, setShowLoginModal } = useAuthProtection({
        requireProfileCompletion: true,
        requireAuth: false,
        checkOnMount: false
    });

    useEffect(() => {
        if (open) {
            const authorized = checkAuth();
            if (!authorized) {
                onOpenChange(false);
            }
        }
    }, [open, checkAuth, onOpenChange]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [slug, setSlug] = useState('');
    const [isSlugModified, setIsSlugModified] = useState(false);
    const [slugError, setSlugError] = useState<string | null>(null);

    // Auto-generate slug from title with debouncing and cleanup
    useEffect(() => {
        if (!isSlugModified && title.trim()) {
            const timer = setTimeout(() => {
                try {
                    const generatedSlug = slugify(title);
                    setSlug(generatedSlug);
                    setSlugError(null);
                } catch (error) {
                    console.error('[SLUG_GENERATION_ERROR]:', error);
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [title, isSlugModified]);

    useEffect(() => {
        if (!category && categories.length > 0) {
            setCategory(categories[0]);
        }
    }, [categories, category]);

    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mediaUrls.length >= 5) {
            toast.error("Maximum 5 images allowed");
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
            toast.error("Something went wrong during upload");
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

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!content.trim() && mediaUrls.length === 0) {
            toast.error("Content or images are required");
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
                    title,
                    content,
                    category,
                    type: mediaUrls.length > 0 ? 'photo' : 'text',
                    privacy: 'public',
                    media: mediaUrls,
                    slug: slug.trim() || undefined,
                }),
            });

            if (response.ok) {
                setTitle('');
                setContent('');
                setMediaUrls([]);
                setCategory(categories[0] || '');
                setSlug('');
                setIsSlugModified(false);
                setSlugError(null);
                onOpenChange(false);
                toast.success("Post created successfully!");
                window.location.reload();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to create post");
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error("An unexpected error occurred while creating post");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitizedValue = rawValue.toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric except -
            .replace(/-+/g, '-')             // Replace multiple - with single -
            .replace(/^-+|-+$/g, '');        // Remove leading/trailing -

        setSlug(rawValue);
        setIsSlugModified(true);

        if (rawValue !== sanitizedValue) {
            setSlugError("Slug sanitized to URL-safe format");
        } else {
            setSlugError(null);
        }
    };

    return (
        <>
            <ProfileCompletionModal
                open={showProfileModal}
                onOpenChange={setShowProfileModal}
            />
            <LoginModal 
                open={showLoginModal} 
                onOpenChange={setShowLoginModal}
                title="Login to Create Post"
                description="Sign in to share your thoughts, photos, and updates with the Pathchakro community."
            />
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-3xl border-2">
                    <DialogHeader className="p-6 border-b bg-muted/20">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Create Post</DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-start gap-4">
                                {session?.user?.image ? (
                                    <div className="h-12 w-12 rounded-2xl overflow-hidden relative border-2 shadow-sm">
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name || 'User'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-black text-xl border-2 shadow-sm">
                                        {session?.user?.name?.[0] || 'U'}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-black text-lg leading-none mb-1">{session?.user?.name || 'User Name'}</p>
                                    <div className="relative inline-block">
                                        <Select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="text-[10px] font-black uppercase tracking-widest h-8 px-3 rounded-xl bg-muted/50 border-2 hover:bg-muted transition-colors focus:ring-0"
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Post Title</Label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What's on your mind?"
                                    className="w-full h-14 rounded-2xl border-2 bg-muted/20 px-4 text-lg font-bold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <Label htmlFor="slug" className="font-black text-xs uppercase tracking-widest text-muted-foreground">Custom URL Slug (Optional)</Label>
                                    {slug && (
                                        <span className="text-[10px] font-black text-primary uppercase">Preview: /posts/{slugify(slug)}</span>
                                    )}
                                </div>
                                <input
                                    id="slug"
                                    type="text"
                                    value={slug}
                                    onChange={handleSlugChange}
                                    onBlur={() => setSlug(slugify(slug))}
                                    placeholder="e.g. your-custom-url"
                                    className={`w-full h-12 rounded-2xl border-2 bg-muted/20 px-4 text-sm font-medium transition-all ${slugError ? 'border-amber-400 focus-visible:ring-amber-400' : 'focus-visible:ring-primary'}`}
                                />
                                {slugError && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 px-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {slugError}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border-2 overflow-hidden shadow-sm">
                                <NovelEditor
                                    initialValue={content ? JSON.parse(content) : undefined}
                                    onChange={(val) => setContent(val)}
                                />
                            </div>

                            {mediaUrls.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {mediaUrls.map((url, index) => (
                                        <div key={index} className="relative rounded-2xl overflow-hidden border-2 bg-muted/50 aspect-video group shadow-sm">
                                            <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest py-1.5 text-center">
                                                    Primary Cover
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isUploading && (
                                <div className="flex items-center gap-3 text-sm font-bold text-primary animate-pulse bg-primary/5 p-4 rounded-2xl border-2 border-dashed border-primary/30">
                                    <Loader2 className="h-5 w-5 animate-spin" /> 
                                    Uploading your media...
                                </div>
                            )}

                            <div className="bg-card border-2 p-4 rounded-3xl shadow-inner flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-tight">Add Assets</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Attach photos to your post (max 5)</p>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading || mediaUrls.length >= 5}
                                        className="h-12 rounded-2xl font-black border-2 hover:bg-primary/5 transition-all px-6"
                                    >
                                        <ImageIcon className="h-5 w-5 text-primary mr-2" />
                                        <span>Photo {mediaUrls.length}/5</span>
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-16 rounded-2xl font-black text-xl shadow-lg hover:shadow-xl transition-all"
                                disabled={(!content.trim() && mediaUrls.length === 0) || !title.trim() || isLoading || isUploading}
                            >
                                {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : null}
                                {isLoading ? 'SHARING...' : 'SHARE POST'}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
