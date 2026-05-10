'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import NovelEditor from '@/components/editor/NovelEditor';
import { BookSearch } from '@/components/books/BookSearch';
import { toast } from 'sonner';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';
import { LoginModal } from '@/components/auth/LoginModal';
import { slugify } from '@/lib/utils';

interface CreateReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialBook?: Book | null;
}

interface Book {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
}

export function CreateReviewDialog({ open, onOpenChange, initialBook }: CreateReviewDialogProps) {
    const { checkAuth, showProfileModal, setShowProfileModal, showLoginModal, setShowLoginModal } = useAuthProtection({
        requireProfileCompletion: true,
        requireAuth: false,
        checkOnMount: false
    });

    const [selectedBook, setSelectedBook] = useState<Book | null>(initialBook || null);
    const [rating, setRating] = useState(0);

    // Update selectedBook when initialBook changes
    useEffect(() => {
        if (initialBook) {
            setSelectedBook(initialBook);
        }
    }, [initialBook]);
    
    useEffect(() => {
        if (open) {
            const authorized = checkAuth();
            if (!authorized) {
                onOpenChange(false);
            }
        }
    }, [open, checkAuth, onOpenChange]);

    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [canPublish, setCanPublish] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [editSlug, setEditSlug] = useState('');
    const [isSlugModified, setIsSlugModified] = useState(false);
    const [slugError, setSlugError] = useState<string | null>(null);

    const STORAGE_KEY = 'draft_review';

    // Load draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.selectedBook && !initialBook) setSelectedBook(parsed.selectedBook);
                if (parsed.rating) setRating(parsed.rating);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.content) setContent(parsed.content);
                if (parsed.imageUrl) setImageUrl(parsed.imageUrl);
                if (parsed.editSlug) setEditSlug(parsed.editSlug);
                if (parsed.isSlugModified) setIsSlugModified(parsed.isSlugModified);
            } catch (e) {
                console.error('Failed to parse draft review', e);
            }
        }
    }, [initialBook]);

    // Save draft to localStorage whenever state changes
    useEffect(() => {
        const draft = {
            selectedBook,
            rating,
            title,
            content,
            imageUrl,
            editSlug,
            isSlugModified
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [selectedBook, rating, title, content, imageUrl, editSlug, isSlugModified]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!isSlugModified && title.trim()) {
            setEditSlug(slugify(title));
            setSlugError(null);
        }
    }, [title, isSlugModified]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setImageUrl(data.url);
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            console.error('Image upload error:', error);
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBook || rating === 0 || !title.trim() || !content.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsLoading(true);

        try {
            const reviewResponse = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookId: selectedBook._id,
                    rating,
                    title,
                    content,
                    image: imageUrl || undefined,
                    slug: editSlug.trim() || undefined,
                }),
            });

            if (reviewResponse.ok) {
                setSelectedBook(null);
                setRating(0);
                setTitle('');
                setContent('');
                setImageUrl('');
                setEditSlug('');
                setIsSlugModified(false);
                setSlugError(null);
                localStorage.removeItem(STORAGE_KEY);
                onOpenChange(false);
                toast.success("Review published successfully!");
                window.location.reload();
            } else {
                const data = await reviewResponse.json();
                toast.error(data.error || "Failed to publish review");
            }
        } catch (error) {
            console.error('Error creating review:', error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitizedValue = rawValue.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');

        setEditSlug(rawValue);
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
                title="Login to Write Review"
                description="Sign in to share your thoughts on books and help the community discover great reads."
            />
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-2">
                    <DialogHeader className="p-6 border-b bg-muted/20">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Write a Book Review</DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Select Book *</Label>
                                <BookSearch
                                    selectedBook={selectedBook}
                                    onSelect={(book) => setSelectedBook(book)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Rating *</Label>
                                <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border-2 shadow-inner">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                className="transition-all hover:scale-125"
                                            >
                                                <Star
                                                    className={`h-10 w-10 transition-colors ${star <= (hoveredRating || rating)
                                                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 animate-in zoom-in">
                                            <span className="font-black text-lg text-primary">{rating}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <Label htmlFor="title" className="font-black text-xs uppercase tracking-widest text-muted-foreground">Review Title *</Label>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {title.length} / 70
                                    </span>
                                </div>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setIsSlugModified(false);
                                    }}
                                    placeholder="e.g. A Masterpiece of Modern Literature"
                                    maxLength={70}
                                    required
                                    className="h-14 rounded-2xl border-2 font-bold text-lg px-4"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <Label htmlFor="slug" className="font-black text-xs uppercase tracking-widest text-muted-foreground">Custom URL Slug</Label>
                                    {editSlug && (
                                        <span className="text-[10px] font-black text-primary uppercase">Preview: /reviews/{slugify(editSlug)}</span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Input
                                        id="slug"
                                        value={editSlug}
                                        onChange={handleSlugChange}
                                        onBlur={() => setEditSlug(slugify(editSlug))}
                                        placeholder="url-slug"
                                        className={`h-12 rounded-2xl border-2 px-4 transition-all ${slugError ? 'border-amber-400 focus-visible:ring-amber-400' : 'focus-visible:ring-primary'}`}
                                    />
                                    {!isSlugModified && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => {
                                                setEditSlug(slugify(title));
                                                setSlugError(null);
                                            }}
                                            className="h-12 rounded-2xl font-black border-2 px-6"
                                        >
                                            REGENERATE
                                        </Button>
                                    )}
                                </div>
                                {slugError && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 px-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {slugError}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content" className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Your Review *</Label>
                                <div className="rounded-2xl border-2 overflow-hidden shadow-sm">
                                    <NovelEditor
                                        initialValue={useMemo(() => {
                                            if (!content) return undefined;
                                            try {
                                                return JSON.parse(content);
                                            } catch (e) {
                                                return undefined;
                                            }
                                        }, [content])}
                                        onChange={(val) => setContent(val)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image" className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Review Image (Optional)</Label>
                                <div className="flex flex-col gap-3">
                                    {imageUrl ? (
                                        <div className="relative w-full h-56 bg-muted rounded-3xl overflow-hidden border-2 shadow-inner group">
                                            <Image src={imageUrl} alt="Review attachment" fill className="object-cover" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-3 right-3 h-10 w-10 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setImageUrl('')}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/10 p-4 rounded-2xl border-2 border-dashed flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center">
                                                <ImageIcon className="h-6 w-6 text-primary/40" />
                                            </div>
                                            <div className="text-center">
                                                <Label htmlFor="image" className="cursor-pointer font-black text-primary hover:underline">Upload photo</Label>
                                                <p className="text-[10px] text-muted-foreground font-medium">PNG, JPG up to 5MB</p>
                                            </div>
                                            <Input
                                                id="image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploadingImage}
                                                className="hidden"
                                            />
                                            {isUploadingImage && <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1 h-14 rounded-2xl font-black border-2"
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!selectedBook || rating === 0 || !title.trim() || !content.trim() || isLoading || !canPublish}
                                    className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    {isLoading ? 'PUBLISHING...' : 'PUBLISH REVIEW'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
