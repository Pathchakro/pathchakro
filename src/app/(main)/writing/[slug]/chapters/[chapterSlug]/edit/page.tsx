'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Save, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import NovelEditor from '@/components/editor/NovelEditor';
import { Textarea } from '@/components/ui/textarea';
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
    const rawChapterSlug = params?.chapterSlug; // Updated to match folder rename

    // Validate and narrow types before use
    const isValidSlug = typeof rawSlug === 'string' && !Array.isArray(rawSlug);
    const isValidChapterSlug = typeof rawChapterSlug === 'string' && !Array.isArray(rawChapterSlug);

    const projectSlug = isValidSlug ? rawSlug : '';
    const chapterSlug = isValidChapterSlug ? rawChapterSlug : '';

    const [project, setProject] = useState<WritingProject | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [chapterId, setChapterId] = useState<string>(''); // State to store resolved chapter ID

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

    const { parsedContent, parseError } = useMemo(() => {
        if (!content) return { parsedContent: undefined, parseError: false };
        try {
            return { parsedContent: JSON.parse(content), parseError: false };
        } catch (e) {
            console.error('Failed to parse chapter content:', e);
            return { parsedContent: undefined, parseError: true };
        }
    }, [content]);

    useEffect(() => {
        if (!isValidSlug || !isValidChapterSlug) {
            toast.error('Invalid URL parameters');
            router.replace('/writing');
        }
    }, [isValidSlug, isValidChapterSlug, router]);

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

                    // Find chapter by ID (if it looks like an ObjectId) OR Slug
                    let chapter;
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(chapterSlug);

                    if (isObjectId) {
                        chapter = data.project.chapters.find((c: any) => c._id === chapterSlug);
                    }

                    if (!chapter) {
                        chapter = data.project.chapters.find((c: any) => c.slug === chapterSlug);
                    }

                    if (chapter) {
                        setChapterId(chapter._id); // Store ID for PUT request
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

        if (projectSlug && chapterSlug) {
            fetchProject();
        }
    }, [projectSlug, chapterSlug, router, reset]);

    const onSubmit = async (data: ChapterData) => {
        if (!project || !chapterId) {
            toast.error('Missing project or chapter information. Please reload safely.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/api/writing/${projectSlug}/chapters`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId, // Use the stored ID
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
                                    {parseError && (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 mb-4">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-yellow-800 text-sm">Content Parsing Error</p>
                                                <p className="text-xs text-yellow-700">
                                                    The saved content format is invalid and cannot be loaded into the visual editor.
                                                    To prevent data loss, you can edit the raw content below or reset it.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="min-h-[500px] border rounded-lg overflow-hidden bg-white">
                                        {!parseError ? (
                                            <NovelEditor
                                                initialValue={parsedContent}
                                                onChange={(val) => setValue('content', val)}
                                            />
                                        ) : (
                                            <div className="p-4">
                                                <Textarea
                                                    value={content}
                                                    onChange={(e) => setValue('content', e.target.value)}
                                                    rows={20}
                                                    className="font-mono text-sm focus-visible:ring-0 border-none shadow-none"
                                                    placeholder="Raw JSON content..."
                                                />
                                            </div>
                                        )}
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
                                        disabled={isSaving || !project || !chapterId}
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
