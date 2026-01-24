'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Trash2, ArrowLeft, Upload, X } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';

const tourSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    destination: z.string().min(3, 'Destination is required'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    departureLocation: z.string().min(3, 'Departure location is required'),
    bannerUrl: z.string().optional(),
    budget: z.number().min(0, 'Budget must be positive'),
    itinerary: z.array(z.object({
        day: z.number(),
        title: z.string(),
        description: z.string(),
        location: z.string().optional(),
    })).optional(),
});

type TourData = z.infer<typeof tourSchema>;

export default function EditTourPage() {
    const router = useRouter();
    const params = useParams();
    const tourId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string>('');

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TourData>({
        resolver: zodResolver(tourSchema),
        defaultValues: {
            itinerary: [{ day: 1, title: '', description: '', location: '' }],
        },
    });

    const currentBannerUrl = watch('bannerUrl');

    useEffect(() => {
        if (tourId) {
            fetchTourData();
        }
    }, [tourId]);

    const fetchTourData = async () => {
        try {
            const response = await fetch(`/api/tours/${tourId}`);
            if (!response.ok) throw new Error('Failed to fetch tour');
            const data = await response.json();

            // Format dates for input type="date"
            const formattedData = {
                ...data.tour,
                startDate: data.tour.startDate.split('T')[0],
                endDate: data.tour.endDate.split('T')[0],
            };

            reset(formattedData);
            if (data.tour.bannerUrl) {
                setBannerPreview(data.tour.bannerUrl);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load tour data');
        } finally {
            setIsLoading(false);
        }
    };

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'itinerary',
    });

    const onSubmit = async (data: TourData) => {
        setIsSaving(true);
        setError('');

        try {
            let bannerUrl = data.bannerUrl;

            if (bannerFile) {
                const formData = new FormData();
                formData.append('file', bannerFile);
                const uploadResponse = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload banner image');
                }

                const uploadResult = await uploadResponse.json();
                bannerUrl = uploadResult.displayUrl || uploadResult.url;
            } else if (!bannerUrl && !currentBannerUrl) {
                // If banner was removed (logic can be more complex if we allow removal)
                // For now assuming if preview is empty, it's removed? Not necessarily.
            }

            const tourData = {
                ...data,
                bannerUrl,
            };

            const response = await fetch(`/api/tours/${tourId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tourData),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to update tour');
                return;
            }

            router.push(`/tours/${result.tour._id}`);
            router.refresh();
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading tour details...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Link href={`/profile/me`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Edit Tour</CardTitle>
                            <CardDescription>
                                Update your tour details
                            </CardDescription>
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
                            <Label>Cover Image (OG Banner)</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => document.getElementById('banner-upload')?.click()}>
                                <input
                                    type="file"
                                    id="banner-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setBannerFile(file);
                                            setBannerPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                {bannerPreview ? (
                                    <div className="relative aspect-video w-full max-w-xl mx-auto rounded-lg overflow-hidden">
                                        <Image
                                            src={bannerPreview}
                                            alt="Banner preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setBannerFile(null);
                                                setBannerPreview('');
                                                setValue('bannerUrl', ''); // Clear form value
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <p>Click to upload new banner image</p>
                                        <p className="text-xs">Recommended size: 1200x630px</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Tour Title *</Label>
                            <Input
                                id="title"
                                {...register('title')}
                                disabled={isSaving}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destination">Destination *</Label>
                            <Input
                                id="destination"
                                {...register('destination')}
                                disabled={isSaving}
                            />
                            {errors.destination && (
                                <p className="text-sm text-red-500">{errors.destination.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="departureLocation">Departure Location *</Label>
                            <Input
                                id="departureLocation"
                                {...register('departureLocation')}
                                disabled={isSaving}
                            />
                            {errors.departureLocation && (
                                <p className="text-sm text-red-500">{errors.departureLocation.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                rows={4}
                                {...register('description')}
                                disabled={isSaving}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Dates & Budget */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    {...register('startDate')}
                                    disabled={isSaving}
                                />
                                {errors.startDate && (
                                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    {...register('endDate')}
                                    disabled={isSaving}
                                />
                                {errors.endDate && (
                                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget (৳) *</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min="0"
                                    {...register('budget', { valueAsNumber: true })}
                                    disabled={isSaving}
                                />
                                {errors.budget && (
                                    <p className="text-sm text-red-500">{errors.budget.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Itinerary */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Itinerary (Optional)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({
                                        day: fields.length + 1,
                                        title: '',
                                        description: '',
                                        location: '',
                                    })}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Day
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium">Day {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Day title"
                                            {...register(`itinerary.${index}.title` as const)}
                                        />
                                        <Textarea
                                            placeholder="What will happen this day?"
                                            rows={2}
                                            {...register(`itinerary.${index}.description` as const)}
                                        />
                                        <Input
                                            placeholder="Location (optional)"
                                            {...register(`itinerary.${index}.location` as const)}
                                        />
                                    </div>
                                </Card>
                            ))}
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
                                disabled={isSaving}
                                className="flex-1"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
