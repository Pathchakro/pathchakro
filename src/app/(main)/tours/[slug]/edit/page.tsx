'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import LoadingSpinner from '@/components/ui/Loading';
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

export default function EditTourPage() {
    const router = useRouter();
    const params = useParams();
    const tourSlug = params.slug as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [tourId, setTourId] = useState<string | null>(null);
    const previewUrlsRef = useRef<string[]>([]);

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
            images: [],
        },
    });

    const description = watch('description');
    const images = watch('images') || [];

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

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        if (tourSlug) {
            fetchTourData();
        }
    }, [tourSlug]);

    const fetchTourData = async () => {
        try {
            const response = await fetch(`/api/tours/slug/${tourSlug}`);
            if (!response.ok) throw new Error('Failed to fetch tour');
            const data = await response.json();
            
            const tour = data.tour || data;
            setTourId(tour._id);

            // Format dates for input type="date"
            const formattedData = {
                ...tour,
                startDate: tour.startDate?.split('T')[0] || '',
                endDate: tour.endDate?.split('T')[0] || '',
                departureDateTime: tour.departureDateTime ? new Date(tour.departureDateTime).toISOString().slice(0, 16) : '',
            };

            reset(formattedData);
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + imageFiles.length + images.length > 10) {
            setError('Maximum 10 images allowed');
            return;
        }

        const newFiles = [...imageFiles, ...files];
        setImageFiles(newFiles);

        const newPreviews = files.map(file => {
            const url = URL.createObjectURL(file);
            previewUrlsRef.current.push(url);
            return url;
        });
        setImagePreviews([...imagePreviews, ...newPreviews]);
        
        // Reset input value to allow selecting same files again
        e.target.value = '';
    };

    const removeNewImage = (index: number) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);

        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const removeExistingImage = (index: number) => {
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setValue('images', updatedImages);
    };

    const onSubmit = async (data: TourData) => {
        if (!tourId) return;
        setIsSaving(true);
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

            const allImages = [...images, ...uploadedImageUrls];
            
            // Sync itinerary days to ensure they are sequential
            const updatedItinerary = data.itinerary?.map((item, index) => ({
                ...item,
                day: index + 1
            })) || [];

            const tourData = {
                ...data,
                images: allImages,
                bannerUrl: allImages[0] || '',
                itinerary: updatedItinerary,
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

            // Redirect back to the tour page using the original slug or new one if returned
            const newSlug = result.tour?.slug || result.slug || tourSlug;
            router.push(`/tours/${newSlug}`);
            router.refresh();
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="max-w-4xl mx-auto p-8"><LoadingSpinner /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Link href={`/tours/${tourSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Tour
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
                                Update your tour details and images
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

                        {/* Multi-Image Upload */}
                        <div className="space-y-2">
                            <Label>Tour Images (Max 10) - First image is the cover</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Existing Images */}
                                {images.map((url, index) => (
                                    <div key={`existing-${index}`} className="relative aspect-video rounded-lg overflow-hidden border group">
                                        <Image
                                            src={url}
                                            alt={`Existing ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeExistingImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                                                COVER
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* New Image Previews */}
                                {imagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative aspect-video rounded-lg overflow-hidden border group border-primary/30">
                                        <Image
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeNewImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            NEW
                                        </div>
                                    </div>
                                ))}

                                {/* Add Button */}
                                {images.length + imageFiles.length < 10 && (
                                    <div 
                                        className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer aspect-video"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Add Images</span>
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
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Tour Title *</Label>
                                <Input
                                    id="title"
                                    {...register('title')}
                                    disabled={isSaving}
                                    placeholder="Enter tour title"
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="destination">Destination *</Label>
                                    <Input
                                        id="destination"
                                        {...register('destination')}
                                        disabled={isSaving}
                                        placeholder="Where is the tour going?"
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
                                        placeholder="Starting point"
                                    />
                                    {errors.departureLocation && (
                                        <p className="text-sm text-red-500">{errors.departureLocation.message}</p>
                                    )}
                                </div>
                            </div>
 
                            <div className="space-y-2">
                                <Label htmlFor="departureDateTime">Departure Date & Time *</Label>
                                <Input
                                    id="departureDateTime"
                                    type="datetime-local"
                                    {...register('departureDateTime')}
                                    disabled={isSaving}
                                />
                                {errors.departureDateTime && (
                                    <p className="text-sm text-red-500">{errors.departureDateTime.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Rich Text Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <div className="min-h-[300px] border rounded-lg overflow-hidden ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border">
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

                            <div className="space-y-2 col-span-2 md:col-span-1">
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
                                <Label className="text-lg font-bold">Itinerary</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full shadow-sm"
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

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <Card key={field.id} className="p-6 border-l-4 border-l-primary relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {index + 1}
                                            </div>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Day Title</Label>
                                                    <Input
                                                        placeholder="e.g. Exploring the Ancient Ruins"
                                                        {...register(`itinerary.${index}.title` as const)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Location</Label>
                                                    <Input
                                                        placeholder="e.g. Comilla, Bangladesh"
                                                        {...register(`itinerary.${index}.location` as const)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Day Description</Label>
                                                <Textarea
                                                    placeholder="Describe the activities for this day..."
                                                    rows={3}
                                                    {...register(`itinerary.${index}.description` as const)}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="flex-1 h-12"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="flex-[2] h-12 shadow-lg shadow-primary/20"
                            >
                                {isSaving ? 'Updating Tour...' : 'Update Tour'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

