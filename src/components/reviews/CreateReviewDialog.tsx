'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface CreateReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateReviewDialog({ open, onOpenChange }: CreateReviewDialogProps) {
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bookTitle || !bookAuthor || rating === 0 || !content) return;

        setIsLoading(true);

        try {
            // First, create or find the book
            const bookResponse = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: bookTitle,
                    author: bookAuthor,
                }),
            });

            const bookData = await bookResponse.json();

            if (!bookData.book) {
                alert('Failed to create book');
                return;
            }

            // Create the review
            const reviewResponse = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookId: bookData.book._id,
                    rating,
                    content,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });

            if (reviewResponse.ok) {
                setBookTitle('');
                setBookAuthor('');
                setRating(0);
                setContent('');
                setTags('');
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Write a Book Review</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bookTitle">Book Title *</Label>
                        <Input
                            id="bookTitle"
                            value={bookTitle}
                            onChange={(e) => setBookTitle(e.target.value)}
                            placeholder="The Intelligent Investor"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bookAuthor">Author *</Label>
                        <Input
                            id="bookAuthor"
                            value={bookAuthor}
                            onChange={(e) => setBookAuthor(e.target.value)}
                            placeholder="Benjamin Graham"
                            required
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
                        <Label htmlFor="content">Your Review *</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts about this book... What did you like? What could be better?"
                            rows={6}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            {content.length}/500 characters
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="investing, finance, must-read"
                        />
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
                            disabled={!bookTitle || !bookAuthor || rating === 0 || !content || isLoading}
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
