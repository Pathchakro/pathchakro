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
import { PenTool, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { BOOK_CATEGORIES } from '@/lib/constants';
import NovelEditor from '@/components/editor/NovelEditor';

const projectSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    coverImage: z.string().optional(),
    introduction: z.string().optional(),
    chapterName: z.string().optional(),
    description: z.string().optional(),
    visibility: z.enum(['private', 'public']),
    category: z.array(z.string())
        .min(1, 'Please select at least one category')
        .max(3, 'Maximum 3 categories allowed'),
});

type ProjectData = z.infer<typeof projectSchema>;

export default function NewWritingProjectPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProjectData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            visibility: 'private',
            category: [],
        },
    });

    const coverImage = watch('coverImage');
    const selectedCategories = watch('category') || [];

    const toggleCategory = (category: string) => {
        const current = selectedCategories;
        let newCategories: string[];

        if (current.includes(category)) {
            newCategories = current.filter(c => c !== category);
        } else {
            if (current.length >= 3) {
                // Optionally alert user or just don't add
                return;
            }
            newCategories = [...current, category];
        }

        setValue('category', newCategories, { shouldValidate: true });
    };

    const onSubmit = async (data: ProjectData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/writing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to create project');
                return;
            }

            alert(result.message);
            router.push(`/writing/${result.project._id}`);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/writing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to My Writing
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                            <PenTool className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Start a New Book</CardTitle>
                            <CardDescription>Begin your writing journey</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Book Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter your book title"
                                {...register('title')}
                                disabled={isLoading}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
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
                            <Label htmlFor="introduction">Introduction</Label>
                            <Textarea
                                id="introduction"
                                placeholder="Write an introduction to your book..."
                                rows={4}
                                {...register('introduction')}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chapterName">Chapter Name</Label>
                            <Input
                                id="chapterName"
                                placeholder="Enter chapter name (optional)"
                                {...register('chapterName')}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <NovelEditor
                                initialValue={watch('description') && watch('description') !== '' ? JSON.parse(watch('description') as string) : undefined}
                                onChange={(val) => setValue('description', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Categories *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {BOOK_CATEGORIES.map((category) => (
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
                            {errors.category && (
                                <p className="text-sm text-red-500">{errors.category.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="visibility">Visibility *</Label>
                            <select
                                id="visibility"
                                {...register('visibility')}
                                className="w-full px-3 py-2 border rounded-md"
                                disabled={isLoading}
                            >
                                <option value="private">Private (Only you can see)</option>
                                <option value="public">Public (Everyone can read)</option>
                            </select>
                            {errors.visibility && (
                                <p className="text-sm text-red-500">{errors.visibility.message}</p>
                            )}
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
                                {isLoading ? 'Creating...' : 'Create Book'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
