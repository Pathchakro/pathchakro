

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import NovelEditor from '@/components/editor/NovelEditor';
import { BookSearch } from '@/components/books/BookSearch';
import { toast } from 'sonner';
import { useAccessControl } from '@/hooks/useAccessControl';

interface CreateReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Book {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
}

export function CreateReviewDialog({ open, onOpenChange }: CreateReviewDialogProps) {
    const { checkBasicAccess } = useAccessControl();

    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [rating, setRating] = useState(0);
    const [canPublish, setCanPublish] = useState(true);

    useEffect(() => {
        if (open) {
            const result = checkBasicAccess(false);
            if (result === 'loading') return;
            const allowed = result as boolean;
            setCanPublish(allowed);
            if (!allowed) {
                toast.error("You need 70% profile completion to publish reviews, but you can still add books.");
            }
        }
    }, [open, checkBasicAccess]);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const STORAGE_KEY = 'draft_review';

    // Load draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.selectedBook) setSelectedBook(parsed.selectedBook);
                if (parsed.rating) setRating(parsed.rating);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.content) setContent(parsed.content);
                if (parsed.imageUrl) setImageUrl(parsed.imageUrl);
            } catch (e) {
                console.error('Failed to parse draft review', e);
            }
        }
    }, []);

    // Save draft to localStorage whenever state changes
    useEffect(() => {
        // Debounce could be good, but for now simple 
        const draft = {
            selectedBook,
            rating,
            title,
            content,
            imageUrl
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [selectedBook, rating, title, content, imageUrl]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB Limit for UI feedback, though API allows 32MB
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
            // Reset input value to allow selecting same file again if needed (optional)
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBook || rating === 0 || !title || !content) return;

        setIsLoading(true);

        try {
            // Create the review
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
                    image: imageUrl || undefined, // Send image if provided
                }),
            });

            if (reviewResponse.ok) {
                setSelectedBook(null);
                setRating(0);
                setTitle('');
                setContent('');
                setImageUrl('');
                localStorage.removeItem('draft_review'); // Clear draft
                onOpenChange(false);
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating review:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Write a Book Review</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Book *</Label>
                        <BookSearch
                            selectedBook={selectedBook}
                            onSelect={(book) => setSelectedBook(book)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Rating *</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                            {rating > 0 && (
                                <span className="ml-2 text-sm text-muted-foreground self-center">
                                    {rating} star{rating !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="title">Review Title *</Label>
                            <span className="text-xs text-muted-foreground">
                                {title.length}/70
                            </span>
                        </div>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a short title for your review"
                            maxLength={70}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Your Review *</Label>
                        <NovelEditor
                            initialValue={content ? JSON.parse(content) : undefined}
                            onChange={(val) => setContent(val)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Review Image (Optional)</Label>
                        <div className="flex flex-col gap-2">
                            {imageUrl ? (
                                <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imageUrl} alt="Review attachment" className="w-full h-full object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2 h-8 w-8 p-0"
                                        onClick={() => setImageUrl('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploadingImage}
                                        className="cursor-pointer"
                                    />
                                    {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload a photo of the book (optional). If empty, we'll use the book cover.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedBook || rating === 0 || !title || !content || isLoading || !canPublish}
                            className="flex-1"
                        >
                            {isLoading ? 'Publishing...' : 'Publish Review'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
