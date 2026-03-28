'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book as BookIcon, ArrowLeft, Loader2, Upload } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { AuthorSearch } from '@/components/books/AuthorSearch';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/Loading';

const bookSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    author: z.string().optional(),
    publisher: z.string().optional(),
    isbn: z.string().optional(),
    coverImage: z.string().optional(),
    pdfUrl: z.string().optional(),
    description: z.string().optional(),
    buyingLink: z.string().optional().or(z.literal('')),
});

type BookData = z.infer<typeof bookSchema>;

export default function EditBookPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [bookId, setBookId] = useState<string | null>(null);
    const [bookData, setBookData] = useState<any>(null);
    const [initialFieldValues, setInitialFieldValues] = useState<any>({});
    const { data: session } = useSession();

    // Dynamic config
    const { categories } = useDynamicConfig();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<BookData>({
        resolver: zodResolver(bookSchema),
    });

    const coverImage = watch('coverImage');

    useEffect(() => {
        if (slug) {
            fetchBook();
        }
    }, [slug]);

    const fetchBook = async () => {
        try {
            const response = await fetch(`/api/books/${slug}?t=${Date.now()}`);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Book not found');
                router.push('/books');
                return;
            }

            if (data.book) {
                const book = data.book;
                setBookId(book._id);
                reset({
                    title: book.title || '',
                    author: book.author || '',
                    publisher: book.publisher || '',
                    isbn: book.isbn || '',
                    coverImage: book.coverImage || '',
                    pdfUrl: book.pdfUrl || '',
                    description: book.description || '',
                    buyingLink: book.buyingLink || '',
                });
                setInitialFieldValues({
                    title: book.title || '',
                    author: book.author || '',
                    publisher: book.publisher || '',
                    isbn: book.isbn || '',
                    coverImage: book.coverImage || '',
                    pdfUrl: book.pdfUrl || '',
                    description: book.description || '',
                    buyingLink: book.buyingLink || '',
                    category: book.category || []
                });
                setBookData(book);
                setSelectedCategories(book.category || []);
            } else {
                toast.error('Book not found');
                router.push('/books');
            }
        } catch (error) {
            console.error('Error fetching book:', error);
            toast.error('Failed to load book data');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const onSubmit = async (data: BookData) => {
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/books/${slug}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    category: selectedCategories,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update book');
                return;
            }

            toast.success(result.message || 'Book updated successfully!');
            router.push(`/books/${result.book.slug || result.book._id}`);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFieldDisabled = (fieldName: string) => {
        if (isSubmitting) return true;
        
        // Admins and owners can edit everything
        const isOwnerOrAdmin = session?.user && (
            (bookData?.addedBy && (typeof bookData.addedBy === 'string' ? bookData.addedBy === session.user.id : bookData.addedBy._id === session.user.id)) ||
            session.user.role === 'admin' ||
            (session.user as any).role === 'super-admin'
        );
        
        if (isOwnerOrAdmin) return false;
        
        // Others can only edit if the field was empty
        const initialValue = initialFieldValues[fieldName];
        if (fieldName === 'category') {
            return initialValue && initialValue.length > 0;
        }
        return !!initialValue;
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="max-w-3xl mx-auto p-4">
                <Link href={`/books/${slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Book
                </Link>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                <BookIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Edit Book</CardTitle>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="title">Book Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter book title"
                                        {...register('title')}
                                        disabled={isFieldDisabled('title')}
                                    />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="author">Author</Label>
                                    <AuthorSearch
                                        value={watch('author') || ''}
                                        onSelect={(name) => setValue('author', name, { shouldValidate: true })}
                                        disabled={isFieldDisabled('author')}
                                    />
                                    {errors.author && (
                                        <p className="text-sm text-red-500">{errors.author.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="publisher">Publisher</Label>
                                    <Input
                                        id="publisher"
                                        placeholder="Publisher name"
                                        {...register('publisher')}
                                        disabled={isFieldDisabled('publisher')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="isbn">ISBN</Label>
                                    <Input
                                        id="isbn"
                                        placeholder="ISBN number"
                                        {...register('isbn')}
                                        disabled={isFieldDisabled('isbn')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>PDF Book File (Optional)</Label>
                                    <div className="flex gap-2 items-center">
                                    <Input
                                            type="file"
                                            accept=".pdf"
                                            disabled={isFieldDisabled('pdfUrl') || uploadingPdf}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                if (file.type !== 'application/pdf') {
                                                    toast.error('Please upload a PDF file');
                                                    return;
                                                }

                                                setUploadingPdf(true);
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', file);

                                                    const res = await fetch('/api/upload/pdf', {
                                                        method: 'POST',
                                                        body: formData,
                                                    });

                                                    const data = await res.json();

                                                    if (!res.ok) {
                                                        throw new Error(data.error || data.message || 'Unknown upload error');
                                                    }

                                                    setValue('pdfUrl', data.url);
                                                    toast.success('PDF uploaded successfully');
                                                } catch (error: any) {
                                                    console.error('PDF Upload Error:', error);
                                                    toast.error(error.message || 'Failed to upload PDF');
                                                } finally {
                                                    setUploadingPdf(false);
                                                }
                                            }}
                                        />
                                        {uploadingPdf && <Loader2 className="h-4 w-4 animate-spin" />}
                                    </div>
                                    {watch('pdfUrl') && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <Upload className="h-3 w-3" /> PDF ready to submit
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                <ImageUploader
                                    onUpload={(url) => setValue('coverImage', url)}
                                    currentImage={coverImage}
                                    variant="cover"
                                    disabled={isFieldDisabled('coverImage')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the book..."
                                    rows={4}
                                    {...register('description')}
                                    disabled={isFieldDisabled('description')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="buyingLink">Buying Link (Optional)</Label>
                                <Input
                                    id="buyingLink"
                                    type="url"
                                    placeholder="https://rehaish.com/..."
                                    {...register('buyingLink')}
                                    disabled={isFieldDisabled('buyingLink')}
                                />
                                {errors.buyingLink && (
                                    <p className="text-sm text-red-500">{errors.buyingLink.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Categories</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {categories?.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => {
                                                if (!isFieldDisabled('category')) {
                                                    toggleCategory(category);
                                                }
                                            }}
                                            disabled={isFieldDisabled('category')}
                                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${selectedCategories.includes(category)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : isFieldDisabled('category') 
                                                    ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-70'
                                                    : 'bg-background hover:bg-muted border-border'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selected: {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'None'}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    {isSubmitting ? 'Updating Book...' : 'Update Book'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthGuard>
    );
}
