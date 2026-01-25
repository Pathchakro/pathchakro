'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { Loader2, Upload } from 'lucide-react';
import { Select } from "@/components/ui/select";

import { BOOK_CATEGORIES, WRITERS_LIST } from '@/lib/constants';
import { AuthorSearch } from '@/components/books/AuthorSearch';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';

const CATEGORIES = BOOK_CATEGORIES;

const bookSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    author: z.string().optional(),
    publisher: z.string().optional(),
    isbn: z.string().optional(),
    coverImage: z.string().optional(),
    pdfUrl: z.string().optional(),
    description: z.string().optional(),
});

type BookData = z.infer<typeof bookSchema>;

export default function AddBookPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Dynamic config
    const { categories } = useDynamicConfig();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<BookData>({
        resolver: zodResolver(bookSchema),
    });

    const coverImage = watch('coverImage');

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const onSubmit = async (data: BookData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/books', {
                method: 'POST',
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
                toast.error(result.error || 'Failed to add book');
                return;
            }

            toast.success(result.message || 'Book added successfully!');
            router.push(`/books/${result.book.slug || result.book._id}`);
        } catch (err: any) {
            toast.error(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/books" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Books
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <Book className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Add New Book</CardTitle>
                            <CardDescription>
                                Contribute to our book library
                            </CardDescription>
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
                                disabled={isLoading}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">Author</Label>
                                <AuthorSearch
                                    value={watch('author')}
                                    onSelect={(name) => setValue('author', name, { shouldValidate: true })}
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
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>PDF Book File (Optional)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        disabled={isLoading || uploadingPdf}
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

                                                if (!res.ok) throw new Error(data.error);

                                                setValue('pdfUrl', data.url);
                                                toast.success('PDF uploaded successfully');
                                            } catch (error) {
                                                console.error(error);
                                                toast.error('Failed to upload PDF');
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
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the book..."
                                rows={4}
                                {...register('description')}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Categories</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${selectedCategories.includes(category)
                                            ? 'bg-primary text-primary-foreground border-primary'
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
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Adding Book...' : 'Add Book'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div >
    );
}
