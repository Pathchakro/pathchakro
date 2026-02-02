'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import NovelEditor from '@/components/editor/NovelEditor';
import { toast } from 'sonner';

const chapterSchema = z.object({
    title: z.string().min(1, 'Chapter title is required'),
    image: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
});

type ChapterData = z.infer<typeof chapterSchema>;

interface WritingProject {
    _id: string;
    title: string;
    coverImage?: string;
    slug?: string;
}

export default function NewChapterPage() {
    const params = useParams();
    const router = useRouter();
    const projectSlug = params.slug as string;

    const [project, setProject] = useState<WritingProject | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ChapterData>({
        resolver: zodResolver(chapterSchema),
    });

    const chapterImage = watch('image');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`/api/writing/${projectSlug}`);

                if (!response.ok) {
                    let errorMessage = 'Failed to load project details';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch {
                        // fallback to default message if JSON parsing fails
                    }
                    toast.error(errorMessage);
                    router.push('/writing');
                    return;
                }

                const data = await response.json();
                if (data.project) {
                    setProject(data.project);
                } else {
                    toast.error('Project not found');
                    router.push('/writing');
                }
            } catch (error) {
                console.error('Error fetching project:', error);
                toast.error('Failed to load project details');
            } finally {
                setIsLoading(false);
            }
        };

        if (projectSlug) {
            fetchProject();
        }
    }, [projectSlug, router]);

    const onSubmit = async (data: ChapterData) => {
        if (!project) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/writing/${projectSlug}/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to create chapter');
                return;
            }

            toast.success('Chapter published successfully!');
            router.push(`/writing/${projectSlug}`);
        } catch (error) {
            console.error('Error saving chapter:', error);
            toast.error('Failed to save chapter');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="max-w-4xl mx-auto p-8 text-center">Loading project details...</div>;
    }

    if (!project) {
        return <div className="max-w-4xl mx-auto p-8 text-center">Project not found</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <Link href={`/writing/${projectSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to {project.title}
            </Link>

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Adding new chapter to</p>
                            <h1 className="text-2xl font-bold">{project.title}</h1>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-0">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-lg">Chapter Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. The Beginning"
                                        className="text-lg py-6"
                                        {...register('title')}
                                        disabled={isSaving}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500">{errors.title.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-lg">Content</Label>
                                    <div className="min-h-[500px] border rounded-lg overflow-hidden bg-white">
                                        <NovelEditor
                                            onChange={(val) => setValue('content', val)}
                                        />
                                    </div>
                                    {errors.content && (
                                        <p className="text-sm text-red-500">{errors.content.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-card border rounded-lg p-4 space-y-4">
                                    <h3 className="font-semibold mb-2">Chapter Settings</h3>

                                    <div className="space-y-2">
                                        <Label>Chapter Cover (Optional)</Label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Used for social sharing cards. Defaults to book cover if empty.
                                        </p>
                                        <div className="aspect-[1.91/1] overflow-hidden rounded-md border bg-muted">
                                            <ImageUploader
                                                onUpload={(url) => setValue('image', url)}
                                                currentImage={chapterImage || project.coverImage}
                                                variant="post"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Publish Chapter
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Auto-generates URL: {project.slug || 'book-name'}/chapter-name
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
