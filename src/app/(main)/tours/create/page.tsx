'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Plus, Trash2, ArrowLeft, Upload, X } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';

import Image from 'next/image';
import { useAccessControl } from '@/hooks/useAccessControl';
import dynamic from 'next/dynamic';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), { ssr: false });

const tourSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    destination: z.string().min(3, 'Destination is required'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    departureLocation: z.string().min(3, 'Departure location is required'),
    departureDateTime: z.string().min(1, 'Departure date and time is required'),
    bannerUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    budget: z.number().min(0, 'Budget must be positive'),
    itinerary: z.array(z.object({
        day: z.number(),
        title: z.string(),
        description: z.string(),
        location: z.string().optional(),
    })).optional(),
});

type TourData = z.infer<typeof tourSchema>;

export default function CreateTourPage() {
    const router = useRouter();
    const { checkVerifiedAccess } = useAccessControl();

    useEffect(() => {
        checkVerifiedAccess(true);
    }, [checkVerifiedAccess]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + imageFiles.length > 10) {
            setError('Maximum 10 images allowed');
            return;
        }

        const newFiles = [...imageFiles, ...files];
        setImageFiles(newFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
        
        // Reset file input to allow re-selecting same files
        if (e.target) {
            e.target.value = '';
        }
    };

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    const removeImage = (index: number) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);

        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === imageFiles.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        const newFiles = [...imageFiles];
        [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
        setImageFiles(newFiles);

        const newPreviews = [...imagePreviews];
        [newPreviews[index], newPreviews[newIndex]] = [newPreviews[newIndex], newPreviews[index]];
        setImagePreviews(newPreviews);
    };

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        watch,
    } = useForm<TourData>({
        resolver: zodResolver(tourSchema),
        defaultValues: {
            itinerary: [{ day: 1, title: '', description: '', location: '' }],
        },
    });

    const description = watch('description');

    // Safe JSON parsing for NovelEditor
    const parsedDescription = useMemo(() => {
        if (!description) return undefined;
        try {
            return typeof description === 'string' ? JSON.parse(description) : description;
        } catch (err) {
            console.error('Failed to parse tour description JSON:', err);
            return undefined;
        }
    }, [description]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'itinerary',
    });

    const onSubmit = async (data: TourData) => {
        setIsLoading(true);
        setError('');

        try {
            const uploadedImageUrls: string[] = [];

            for (const file of imageFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadResponse = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload images');
                }

                const uploadResult = await uploadResponse.json();
                uploadedImageUrls.push(uploadResult.displayUrl || uploadResult.url);
            }

            const tourData = {
                ...data,
                images: uploadedImageUrls,
                bannerUrl: uploadedImageUrls[0], // First image is the banner
            };

            const response = await fetch('/api/tours', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tourData),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to create tour');
                return;
            }

            router.push(`/tours/${result.tour._id}`);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Link href="/tours" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Tours
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Create Tour</CardTitle>
                            <CardDescription>
                                Plan an educational trip or tour
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
                            <Label>Tour Images (Max 10) - First image is the cover</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border group">
                                        <Image
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => moveImage(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ArrowLeft className="h-4 w-4 rotate-90" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => moveImage(index, 'down')}
                                                disabled={index === imagePreviews.length - 1}
                                            >
                                                <ArrowLeft className="h-4 w-4 -rotate-90" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                COVER
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {imagePreviews.length < 10 && (
                                    <div 
                                        className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer aspect-video"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Add Images</span>
                                        <input
                                            type="file"
                                            id="image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Recommended size: 1200x630px. First image will be used for OG/Twitter cards.
                            </p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Tour Title *</Label>
                            <Input
                                id="title"
                                placeholder="Historical Tour of Old Dhaka"
                                {...register('title')}
                                disabled={isLoading}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destination">Destination *</Label>
                            <Input
                                id="destination"
                                placeholder="Old Dhaka, Bangladesh"
                                {...register('destination')}
                                disabled={isLoading}
                            />
                            {errors.destination && (
                                <p className="text-sm text-red-500">{errors.destination.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="departureLocation">Departure Location *</Label>
                            <Input
                                id="departureLocation"
                                placeholder="TSC, Dhaka University"
                                {...register('departureLocation')}
                                disabled={isLoading}
                            />
                            {errors.departureLocation && (
                                <p className="text-sm text-red-500">{errors.departureLocation.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="departureDateTime">Departure Date & Time *</Label>
                            <Input
                                id="departureDateTime"
                                type="datetime-local"
                                {...register('departureDateTime')}
                                disabled={isLoading}
                            />
                            {errors.departureDateTime && (
                                <p className="text-sm text-red-500">{errors.departureDateTime.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <div className="min-h-[300px] border rounded-md">
                                <NovelEditor
                                    initialValue={parsedDescription}
                                    onChange={(value) => setValue('description', value)}
                                />
                            </div>
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
                                    disabled={isLoading}
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
                                    disabled={isLoading}
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
                                    placeholder="5000"
                                    {...register('budget', { valueAsNumber: true })}
                                    disabled={isLoading}
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
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Creating...' : 'Create Tour'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
