'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Card, CardContent } from '@/components/ui/card';
import { useAccessControl } from '@/hooks/useAccessControl';
import LoadingSpinner from '@/components/ui/Loading';
import { ImageUploader } from '@/components/uploads/ImageUploader';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), { ssr: false });

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseSlug = params.slug as string;
    const { data: session } = useSession();
    const { checkVerifiedAccess } = useAccessControl();

    // Verification and page state
    const [loadingCourse, setLoadingCourse] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [banner, setBanner] = useState(''); // URL
    const [description, setDescription] = useState('');
    const [fee, setFee] = useState('');
    const [lastDateRegistration, setLastDateRegistration] = useState('');
    const [classStartDate, setClassStartDate] = useState('');
    const [mode, setMode] = useState('online');
    const [totalClasses, setTotalClasses] = useState('');
    const [slug, setSlug] = useState('');
    const [courseId, setCourseId] = useState('');

    useEffect(() => {
        checkVerifiedAccess(true);
    }, [checkVerifiedAccess]);

    // Fetch existing course data
    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseSlug) return;
            try {
                const res = await fetch(`/api/courses/${courseSlug}`);
                if (!res.ok) {
                    toast.error('Failed to load course details');
                    router.push('/courses');
                    return;
                }
                const data = await res.json();

                // Check authorization: must be the instructor of the course
                const instructorId = typeof data.instructor === 'object' ? data.instructor?._id : data.instructor;
                if (!session?.user?.id || session.user.id !== instructorId) {
                    toast.error('You are not authorized to edit this course');
                    router.push(`/courses/${courseSlug}`);
                    return;
                }

                setIsAuthorized(true);
                setCourseId(data._id);
                setTitle(data.title || '');
                setBanner(data.banner || '');
                setDescription(data.description || '');
                setFee(data.fee ? String(data.fee) : '');
                setMode(data.mode || 'online');
                setTotalClasses(data.totalClasses ? String(data.totalClasses) : '');
                setSlug(data.slug || '');

                // Format dates for date inputs (YYYY-MM-DD)
                if (data.lastDateRegistration) {
                    setLastDateRegistration(new Date(data.lastDateRegistration).toISOString().split('T')[0]);
                }
                if (data.classStartDate) {
                    setClassStartDate(new Date(data.classStartDate).toISOString().split('T')[0]);
                }
            } catch (err) {
                console.error('Error fetching course:', err);
                toast.error('An error occurred while loading course data');
            } finally {
                setLoadingCourse(false);
            }
        };

        if (session) {
            fetchCourse();
        }
    }, [courseSlug, session, router]);

    // Safe JSON parsing for NovelEditor
    const parsedDescription = useMemo(() => {
        if (!description) return undefined;
        try {
            return typeof description === 'string' ? JSON.parse(description) : description;
        } catch (err) {
            console.error('Failed to parse course description JSON:', err);
            return undefined;
        }
    }, [description]);

    const handleBannerUpload = async (file: File) => {
        setUploading(true);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: file,
                headers: { 'content-type': file.type }
            });
            const data = await res.json();
            if (data.url) {
                setBanner(data.url);
                toast.success('Banner uploaded');
            } else {
                toast.error('Upload failed');
            }
        } catch (error) {
            toast.error('Error uploading banner');
        } finally {
            setUploading(false);
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        setSlug(sanitizedValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || !banner || !fee || !lastDateRegistration || !classStartDate || !totalClasses) {
            toast.error('Please fill all fields');
            return;
        }

        const finalSlug = slug.trim()
            .toLowerCase()
            .replace(/^-+|-+$/g, '')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-');

        setSaving(true);
        try {
            const res = await fetch(`/api/courses/${courseSlug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    banner,
                    fee: Number(fee),
                    lastDateRegistration,
                    classStartDate,
                    mode,
                    totalClasses: Number(totalClasses),
                    slug: finalSlug || undefined
                })
            });

            if (res.ok) {
                toast.success('Course updated successfully!');
                const result = await res.json();
                const newSlug = result.slug || finalSlug || courseSlug;
                router.push(`/courses/${newSlug}`);
                router.refresh();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Failed to update course');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    if (!session) {
        return <div className="text-center py-20">Please login to edit a course.</div>;
    }

    if (loadingCourse) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground mt-4">Loading course details...</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return <div className="text-center py-20">Unauthorized. You cannot edit this course.</div>;
    }

    return (
        <div className="container max-w-4xl py-10 space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Edit Course</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold">Course Title</Label>
                            <Input
                                placeholder="e.g. Graphic Design Masterclass"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Custom URL Slug</Label>
                            <Input
                                placeholder="e.g. graphic-design-course"
                                value={slug}
                                onChange={handleSlugChange}
                                pattern="^[a-z0-9-]+$"
                                title="Only lowercase letters, numbers, and hyphens are allowed"
                                className="h-12 rounded-xl font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Banner Image</Label>
                            <ImageUploader
                                onUpload={(url) => setBanner(url)}
                                currentImage={banner}
                                variant="cover"
                                disabled={uploading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Details */}
                <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">Registration Deadline</Label>
                            <Input
                                type="date"
                                value={lastDateRegistration}
                                onChange={(e) => setLastDateRegistration(e.target.value)}
                                className="h-12 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Class Start Date</Label>
                            <Input
                                type="date"
                                value={classStartDate}
                                onChange={(e) => setClassStartDate(e.target.value)}
                                className="h-12 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Course Fee (BDT)</Label>
                            <Input
                                type="number"
                                placeholder="2000"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                className="h-12 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Total Classes</Label>
                            <Input
                                type="number"
                                placeholder="12"
                                value={totalClasses}
                                onChange={(e) => setTotalClasses(e.target.value)}
                                className="h-12 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Mode</Label>
                            <Select value={mode} onValueChange={setMode}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <div className="space-y-4">
                    <Label className="text-xl font-black">Course Details</Label>
                    <div className="min-h-[400px] border-2 rounded-3xl overflow-hidden bg-card shadow-sm">
                        <NovelEditor
                            initialValue={parsedDescription}
                            onChange={(val: string) => setDescription(val)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" className="rounded-xl px-8" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" className="rounded-xl px-12 font-bold" disabled={saving || uploading}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
