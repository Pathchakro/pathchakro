'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    slug: z.string().optional()
});

type ChapterData = z.infer<typeof chapterSchema>;

interface WritingProject {
    _id: string;
    title: string;
    coverImage?: string;
    slug?: string;
    chapters: any[];
}

export default function EditChapterPage() {
    const params = useParams();
    const router = useRouter();

    const rawSlug = params?.slug;
    const rawChapterId = params?.chapterId;

    // Validate and narrow types before use
    const isValidSlug = typeof rawSlug === 'string' && !Array.isArray(rawSlug);
    const isValidChapterId = typeof rawChapterId === 'string' && !Array.isArray(rawChapterId);

    const projectSlug = isValidSlug ? rawSlug : '';
    const chapterId = isValidChapterId ? rawChapterId : '';

    const [project, setProject] = useState<WritingProject | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<ChapterData>({
        resolver: zodResolver(chapterSchema),
    });

    const chapterImage = watch('image');
    const content = watch('content');

    const parsedContent = useMemo(() => {
        if (!content) return undefined;
        try {
            return JSON.parse(content);
        } catch {
            return undefined;
        }
    }, [content]);

    useEffect(() => {
        if (!isValidSlug || !isValidChapterId) {
            toast.error('Invalid URL parameters');
            router.replace('/writing');
        }
    }, [isValidSlug, isValidChapterId, router]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                // Fetch full project content including chapters to find specific chapter
                const response = await fetch(`/api/writing/${projectSlug}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to fetch project');
                }

                const data = await response.json();

                if (data.project) {
                    setProject(data.project);
                    const chapter = data.project.chapters.find((c: any) => c._id === chapterId);

                    if (chapter) {
                        reset({
                            title: chapter.title,
                            image: chapter.image,
                            content: chapter.content,
                            slug: chapter.slug
                        });
                    } else {
                        toast.error('Chapter not found');
                        router.push(`/writing/${projectSlug}`);
                    }
                } else {
                    toast.error('Project not found');
                    router.push('/writing');
                }
            } catch (error) {
                console.error('Error fetching project:', error);
                toast.error('Failed to load details');
            } finally {
                setIsLoading(false);
            }
        };

        if (projectSlug && chapterId) {
            fetchProject();
        }
    }, [projectSlug, chapterId, router, reset]);

    const onSubmit = async (data: ChapterData) => {
        if (!project) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/writing/${projectSlug}/chapters`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId,
                    ...data
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update chapter');
                return;
            }

            toast.success('Chapter updated successfully!');
            router.push(`/writing/${projectSlug}`);
        } catch (error) {
            console.error('Error updating chapter:', error);
            toast.error('Failed to update chapter');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="max-w-4xl mx-auto p-8 text-center">Loading chapter details...</div>;
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
                            <p className="text-sm text-muted-foreground">Editing Chapter</p>
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
                                    <Label htmlFor="slug" className="text-sm text-muted-foreground">Slug (URL Segment)</Label>
                                    <Input
                                        id="slug"
                                        {...register('slug')}
                                        className="font-mono text-sm"
                                        disabled={isSaving}
                                    />
                                    <p className="text-xs text-muted-foreground">Modify carefully. Changing this changes the specific URL for this chapter.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-lg">Content</Label>
                                    <div className="min-h-[500px] border rounded-lg overflow-hidden bg-white">
                                        <NovelEditor
                                            initialValue={parsedContent}
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
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
