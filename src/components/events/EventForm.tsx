'use client';

import { useState, useEffect } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Image as ImageIcon, X } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import NovelEditor from '@/components/editor/NovelEditor';

const eventSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    eventType: z.enum(['online', 'offline']),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    startDate: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Time is required'),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export interface EventData {
    title: string;
    description: string;
    eventType: 'online' | 'offline';
    location?: string;
    meetingLink?: string;
    startDate: string;
    startTime: string;
    banner?: string;
}

interface EventFormProps {
    initialData?: Partial<EventData>;
    onSubmit: (data: EventData, bannerFile: File | null) => Promise<void>;
    isLoading: boolean;
    uploadingBanner: boolean;
    mode: 'create' | 'edit';
}

export function EventForm({ initialData, onSubmit, isLoading, uploadingBanner, mode }: EventFormProps) {
    const router = useRouter();
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.banner || null);
    const [isDragging, setIsDragging] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            eventType: 'online',
        }
    });

    const eventType = watch('eventType');

    // Handle initial data for date fields
    useEffect(() => {
        if (initialData) {
            if (initialData.title) setValue('title', initialData.title);
            if (initialData.description) setValue('description', initialData.description);
            if (initialData.eventType) setValue('eventType', initialData.eventType);
            if (initialData.location) setValue('location', initialData.location);
            if (initialData.meetingLink) setValue('meetingLink', initialData.meetingLink);

            if (initialData.startTime) {
                const start = new Date(initialData.startTime);
                if (!isNaN(start.getTime())) {
                    // Split into YYYY-MM-DD and HH:mm
                    const datePart = start.toISOString().split('T')[0];
                    const timePart = start.toTimeString().slice(0, 5);
                    setValue('startDate', datePart);
                    setValue('startTime', timePart);
                }
            }
        }
    }, [initialData, setValue]);

    // Cleanup preview URL to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const processFile = (file: File) => {
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size too large. Max 5MB allowed.');
                return;
            }

            setBannerFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const removeBanner = () => {
        setBannerFile(null);
        setPreviewUrl(null);
        // Reset file input value
        const fileInput = document.getElementById('banner') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const onFormSubmit = (values: EventFormValues) => {
        // Merge date and time
        const startTime = new Date(`${values.startDate}T${values.startTime}`).toISOString();

        const data: EventData = {
            title: values.title,
            description: values.description,
            eventType: values.eventType,
            location: values.location,
            meetingLink: values.meetingLink,
            startDate: values.startDate,
            startTime: values.startTime,
        };

        onSubmit(data, bannerFile);
    };

    const onErrors = (errors: FieldErrors<EventFormValues>) => {
        console.error('Validation Errors:', errors);
        const firstError = Object.values(errors)[0];
        toast.error(firstError?.message?.toString() || 'Please check the form for errors');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">{mode === 'create' ? 'Create Event' : 'Edit Event'}</CardTitle>
                        <CardDescription>
                            {mode === 'create' ? 'Organize an educational meetup or event' : 'Update event details'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(onFormSubmit, onErrors)} className="space-y-6">

                    <div className="space-y-4">
                        <Label htmlFor="banner">Event Banner (Optional)</Label>

                        {previewUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border bg-muted aspect-[1200/630] max-h-[300px]">
                                <Image
                                    src={previewUrl}
                                    alt="Banner Preview"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => document.getElementById('banner')?.click()}
                                    >
                                        Change Image
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={removeBanner}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => document.getElementById('banner')?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isDragging
                                        ? 'border-primary bg-primary/5'
                                        : 'hover:bg-accent/50'
                                    }`}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-sm text-center">
                                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                    <p className="text-xs text-muted-foreground mt-1">Recommended size: 1200x630px (Open Graph standard)</p>
                                </div>
                            </div>
                        )}

                        <Input
                            id="banner"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title *</Label>
                        <Input
                            id="title"
                            placeholder="Monthly Book Discussion"
                            {...register('title')}
                            disabled={isLoading}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <NovelEditor
                            initialValue={watch('description') && watch('description') !== '' ? JSON.parse(watch('description') as string) : undefined}
                            onChange={(val) => setValue('description', val, { shouldValidate: true })}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="eventType">Event Type *</Label>
                        <Select
                            id="eventType"
                            {...register('eventType')}
                            disabled={isLoading}
                        >
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </Select>
                    </div>

                    {eventType === 'online' ? (
                        <div className="space-y-2">
                            <Label htmlFor="meetingLink">Meeting Link *</Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="https://meet.google.com/..."
                                {...register('meetingLink')}
                                disabled={isLoading}
                            />
                            {errors.meetingLink && (
                                <p className="text-sm text-red-500">{errors.meetingLink.message}</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="location">Location/Venue *</Label>
                            <Input
                                id="location"
                                placeholder="Dhaka University, Room 305"
                                {...register('location')}
                                disabled={isLoading}
                            />
                            {errors.location && (
                                <p className="text-sm text-red-500">{errors.location.message}</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Event Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                {...register('startDate')}
                                disabled={isLoading}
                            />
                            {errors.startDate && (
                                <p className="text-sm text-red-500">{errors.startDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                                id="startTime"
                                type="time"
                                {...register('startTime')}
                                disabled={isLoading}
                            />
                            {errors.startTime && (
                                <p className="text-sm text-red-500">{errors.startTime.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Event Roles</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            Participants can register for these roles after the event is created:
                        </p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Up to 5 Speakers (20 minutes each with topic)</li>
                            <li>• Unlimited Listeners</li>
                        </ul>
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
                            {isLoading ? (uploadingBanner ? 'Uploading Banner...' : (mode === 'create' ? 'Creating...' : 'Updating...')) : (mode === 'create' ? 'Create Event' : 'Update Event')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
