'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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


    const onFormSubmit = (data: EventData) => {
        onSubmit(data, bannerFile);
    };

    const onErrors = (errors: any) => {
        console.error('Validation Errors:', errors);
        const firstError = Object.values(errors)[0] as any;
        toast.error(firstError?.message || 'Please check the form for errors');
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

                    <div className="space-y-2">
                        <Label htmlFor="banner">Event Banner (Optional)</Label>
                        <Input
                            id="banner"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setBannerFile(e.target.files[0]);
                                }
                            }}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Recommended size: 1200x630px (Open Graph standard)
                        </p>
                        {/* Show existing banner preview if explicitly needed, though browser file input doesn't show it */}
                        {initialData?.banner && !bannerFile && (
                            <p className="text-xs text-green-600">Current banner: {initialData.banner.split('/').pop()}</p>
                        )}
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
                            <li>• 1 Host, 1 Anchor, 1 Summarizer, 1 Opener, 1 Closer</li>
                            <li>• Up to 5 Lecturers (2 minutes each with topic)</li>
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
