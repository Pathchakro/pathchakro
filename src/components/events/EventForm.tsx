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

const eventSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    eventType: z.enum(['online', 'offline']),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
});

export type EventData = z.infer<typeof eventSchema>;

interface EventFormProps {
    initialData?: EventData & { banner?: string };
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
    } = useForm<EventData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            eventType: 'online',
            ...initialData,
        }
    });

    const eventType = watch('eventType');

    // Handle initial data for date fields which need specific formatting for datetime-local
    useEffect(() => {
        if (initialData) {
            if (initialData.startTime) {
                const start = new Date(initialData.startTime);
                if (!isNaN(start.getTime())) {
                    // Format to YYYY-MM-DDThh:mm for datetime-local input
                    const formattedStart = start.toISOString().slice(0, 16);
                    setValue('startTime', formattedStart);
                }
            }
            if (initialData.endTime) {
                const end = new Date(initialData.endTime);
                if (!isNaN(end.getTime())) {
                    const formattedEnd = end.toISOString().slice(0, 16);
                    setValue('endTime', formattedEnd);
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

    const onFormSubmit = (data: EventData) => {
        onSubmit(data, bannerFile);
    };

    const onErrors = (errors: FieldErrors<EventData>) => {
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
                                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                    isDragging 
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
                        <Textarea
                            id="description"
                            placeholder="Describe the event, agenda, and what participants will learn..."
                            rows={4}
                            {...register('description')}
                            disabled={isLoading}
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
                            <Label htmlFor="startTime">Start Date & Time *</Label>
                            <Input
                                id="startTime"
                                type="datetime-local"
                                {...register('startTime')}
                                disabled={isLoading}
                            />
                            {errors.startTime && (
                                <p className="text-sm text-red-500">{errors.startTime.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Date & Time *</Label>
                            <Input
                                id="endTime"
                                type="datetime-local"
                                {...register('endTime')}
                                disabled={isLoading}
                            />
                            {errors.endTime && (
                                <p className="text-sm text-red-500">{errors.endTime.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Event Roles</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            Participants can register for these roles after the event is created:
                        </p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Up to 5 Speakers (2 minutes each with topic)</li>
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
