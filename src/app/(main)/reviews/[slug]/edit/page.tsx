'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react';
import NovelEditor from '@/components/editor/NovelEditor';
import { toast } from 'sonner';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import LoadingSpinner from '@/components/ui/Loading';
import Link from 'next/link';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { slugify } from '@/lib/utils';

interface Review {
    _id: string;
    book: {
        _id: string;
        title: string;
        author: string;
        coverImage?: string;
    };
    rating: number;
    title: string;
    slug: string;
    content: string;
    image?: string;
}

export default function EditReviewPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const { checkAuth } = useAuthProtection({
        requireProfileCompletion: true,
        requireAuth: true,
        checkOnMount: true
    });

    const [review, setReview] = useState<Review | null>(null);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [isSlugModified, setIsSlugModified] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const parsedInitialContent = useMemo(() => {
        if (!content) return undefined;
        try {
            return JSON.parse(content);
        } catch (e) {
            return undefined;
        }
    }, [content]);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                // Fetch the review from the API
                const res = await fetch(`/api/reviews/${slug}`);
                if (!res.ok) throw new Error('Review not found');
                
                const data = await res.json();
                const r = data.review;
                
                setReview(r);
                setRating(r.rating);
                setTitle(r.title);
                setContent(r.content);
                setImageUrl(r.image || '');
                setEditSlug(r.slug);
                setIsSlugModified(true); // Pre-set to true so it doesn't auto-generate from title on load
            } catch (error) {
                console.error('Error fetching review:', error);
                toast.error('Failed to load review');
                router.push('/reviews');
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) fetchReview();
    }, [slug, router]);

    useEffect(() => {
        if (!isSlugModified && title.trim()) {
            setEditSlug(slugify(title));
        }
    }, [title, isSlugModified]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setImageUrl(data.url);
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!review || rating === 0 || !title.trim() || !content.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/api/reviews/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    title,
                    content,
                    image: imageUrl || undefined,
                    slug: editSlug?.trim() ? slugify(editSlug.trim()) : undefined,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Review updated successfully');
                router.push(`/reviews/${data.review.slug}`);
            } else {
                toast.error(data.error || 'Failed to update review');
            }
        } catch (error) {
            console.error('Error updating review:', error);
            toast.error('Something went wrong during update');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-20"><LoadingSpinner /></div>;
    if (!review) return null;

    return (
        <div className="container max-w-4xl py-10">
            <Link href={`/reviews/${slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-8 group transition-all">
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ArrowLeft className="h-4 w-4" />
                </div>
                Back to Review
            </Link>

            <div className="bg-card rounded-3xl border-2 p-8 shadow-sm">
                <h1 className="text-4xl font-black mb-8 leading-tight">Edit Your Review</h1>
                
                <div className="flex items-center gap-6 mb-10 p-6 bg-muted/20 rounded-2xl border-2">
                    <div className="w-20 h-28 relative rounded-xl overflow-hidden border-2 shadow-sm flex-shrink-0">
                        {review.book.coverImage ? (
                            <Image src={review.book.coverImage} alt={review.book.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">📚</div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black leading-tight">{review.book.title}</h2>
                        <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">by {review.book.author}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Rating *</Label>
                        <div className="flex gap-2 bg-muted/10 p-4 rounded-2xl border-2 shadow-inner w-fit">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-125"
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Review Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a compelling title"
                            maxLength={70}
                            required
                            className="h-14 rounded-2xl border-2 font-bold text-lg px-4 focus-visible:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Label htmlFor="slug" className="font-black text-xs uppercase tracking-widest text-muted-foreground">Custom URL Slug</Label>
                            {editSlug?.trim() && (
                                <span className="text-[10px] font-black text-primary uppercase">Preview: /reviews/{slugify(editSlug.trim())}</span>
                            )}
                        </div>
                        <Input
                            id="slug"
                            value={editSlug}
                            onChange={(e) => {
                                setEditSlug(e.target.value);
                                setIsSlugModified(true);
                            }}
                            placeholder="url-slug"
                            className="h-12 rounded-2xl border-2 px-4 focus-visible:ring-primary font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content" className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Your Review *</Label>
                        <div className="rounded-2xl border-2 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary">
                            <NovelEditor
                                initialValue={parsedInitialContent}
                                onChange={(val) => setContent(val)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image" className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-1">Review Image (Optional)</Label>
                        <ImageUploader
                            onUpload={(url) => setImageUrl(url)}
                            currentImage={imageUrl}
                            variant="cover"
                            disabled={isUploadingImage}
                        />
                    </div>

                    <div className="flex gap-4 pt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex-1 h-14 rounded-2xl font-black border-2"
                        >
                            CANCEL
                        </Button>
                        <Button
                            type="submit"
                            disabled={rating === 0 || !title.trim() || !content.trim() || isSaving}
                            className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {isSaving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
