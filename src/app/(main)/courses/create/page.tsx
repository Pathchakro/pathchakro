'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useEffect } from 'react';

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

    const handleBannerUpload = async (file: File) => {
        setUploading(true);
        try {
            // Reusing existing upload endpoint which returns { url: string }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !banner || !fee || !lastDateRegistration || !classStartDate || !totalClasses) {
            toast.error('Please fill all fields');
            return;
        }

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
                    totalClasses: Number(totalClasses)
                })
            });

            if (res.ok) {
                toast.success('Course created successfully!');
                router.push('/courses');
            } else {
                toast.error('Failed to create course');
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
        <div className="container max-w-4xl py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Create New Course</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Course Title</Label>
                            <Input
                                placeholder="e.g. Graphic Design Masterclass"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Banner Image</Label>
                            <div className="flex items-center gap-4">
                                {banner && (
                                    <div className="relative h-20 w-32 rounded-lg overflow-hidden border">
                                        <Image src={banner} alt="Banner" fill className="object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
                                        disabled={uploading}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This will be used for OG images and social sharing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details */}
                <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Registration Deadline</Label>
                            <Input
                                type="date"
                                value={lastDateRegistration}
                                onChange={(e) => setLastDateRegistration(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class Start Date</Label>
                            <Input
                                type="date"
                                value={classStartDate}
                                onChange={(e) => setClassStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Course Fee (BDT)</Label>
                            <Input
                                type="number"
                                placeholder="2000"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Classes</Label>
                            <Input
                                type="number"
                                placeholder="12"
                                value={totalClasses}
                                onChange={(e) => setTotalClasses(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mode</Label>
                            <Select value={mode} onValueChange={setMode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <div className="space-y-2">
                    <Label className="text-lg font-semibold">Course Details</Label>
                    <div className="min-h-[400px] border rounded-lg overflow-hidden bg-card">
                        <NovelEditor
                            initialValue={undefined}
                            onChange={(val: string) => setDescription(val)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={loading || uploading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Course
                    </Button>
                </div>
            </form>
        </div>
    );
}
