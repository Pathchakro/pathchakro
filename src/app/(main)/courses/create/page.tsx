'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { slugify } from '@/lib/utils';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), { ssr: false });

export default function CreateCoursePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { checkVerifiedAccess } = useAccessControl();

    useEffect(() => {
        checkVerifiedAccess(true);
    }, [checkVerifiedAccess]);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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
    const [isSlugModified, setIsSlugModified] = useState(false);

    // Auto-generate slug from title
    useEffect(() => {
        if (!isSlugModified && title) {
            setSlug(slugify(title));
        }
    }, [title, isSlugModified]);

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
        // Sanitize: allow only lowercase, numbers, and hyphens
        const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        setSlug(sanitizedValue);
        
        // If the user clears the field, we restore auto-generation
        if (!sanitizedValue) {
            setIsSlugModified(false);
        } else {
            setIsSlugModified(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title || !description || !banner || !fee || !lastDateRegistration || !classStartDate || !totalClasses) {
            toast.error('Please fill all fields');
            return;
        }

        // Final slug sanitization before sending to API
        const finalSlug = slug.trim()
            .toLowerCase()
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-');

        setLoading(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
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
                toast.success('Course created successfully!');
                router.push('/courses');
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Failed to create course');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return <div className="text-center py-20">Please login to create a course.</div>;
    }

    return (
        <div className="container max-w-4xl py-10 space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Create New Course</h1>
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
                            <Label className="font-bold">Custom URL Slug (Optional)</Label>
                            <Input
                                placeholder="e.g. graphic-design-course"
                                value={slug}
                                onChange={handleSlugChange}
                                pattern="^[a-z0-9-]+$"
                                title="Only lowercase letters, numbers, and hyphens are allowed"
                                className="h-12 rounded-xl font-mono text-sm"
                            />
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider ml-1">
                                If left empty, a URL will be automatically generated from the title.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Banner Image</Label>
                            <div className="flex items-center gap-4">
                                {banner && (
                                    <div className="relative h-20 w-32 rounded-2xl overflow-hidden border-2 shadow-sm">
                                        <Image src={banner} alt="Banner" fill className="object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
                                        disabled={uploading}
                                        className="h-12 rounded-xl"
                                    />
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1 ml-1">
                                        This will be used for OG images and social sharing.
                                    </p>
                                </div>
                            </div>
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
                            initialValue={undefined}
                            onChange={(val: string) => setDescription(val)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" className="rounded-xl px-8" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" className="rounded-xl px-12 font-bold" disabled={loading || uploading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Course
                    </Button>
                </div>
            </form>
        </div>
    );
}
