'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { EventForm, EventData } from '@/components/events/EventForm';

interface Props {
    params: Promise<{ slug: string }>;
}

export default function EditEventPage({ params }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [initialData, setInitialData] = useState<any>(null);
    const [fetchError, setFetchError] = useState(false);
    const [slug, setSlug] = useState<string>('');

    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params;
            setSlug(resolvedParams.slug);
            fetchEvent(resolvedParams.slug);
        };
        resolveParams();
    }, [params]);


    const fetchEvent = async (eventSlug: string) => {
        try {
            setFetchError(false);
            const response = await fetch(`/api/events/${eventSlug}`);

            if (!response.ok) {
                throw new Error('Failed to fetch event');
            }

            const data = await response.json();

            if (data.event) {
                setInitialData(data.event);
            } else {
                setFetchError(true);
                toast.error('Event not found');
                router.push('/events');
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            setFetchError(true);
            toast.error('Failed to load event details');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: EventData, bannerFile: File | null) => {
        setIsSaving(true);

        try {
            let bannerUrl = initialData.banner;

            if (bannerFile) {
                setUploadingBanner(true);
                const formData = new FormData();
                formData.append('file', bannerFile);

                const uploadResponse = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                });

                const uploadResult = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadResult.error || 'Failed to upload banner');
                }

                bannerUrl = uploadResult.displayUrl || uploadResult.url;
                setUploadingBanner(false);
            }

            const response = await fetch(`/api/events/${slug}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    banner: bannerUrl || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update event');
                return;
            }

            toast.success('Event updated successfully!');
            // Redirect to the new slug if it changed, or the same one if not
            router.push(`/events/${result.event.slug}`);
        } catch (err: any) {
            toast.error(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSaving(false);
            setUploadingBanner(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Loading event details...</p>
            </div>
        );
    }

    if (fetchError || !initialData) {
        return (
            <div className="max-w-3xl mx-auto p-4 text-center space-y-6 py-20">
                <div className="p-12 border-2 border-dashed rounded-3xl bg-muted/30">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        We couldn't find the event you're looking for or there was an error loading it.
                    </p>
                    <Link
                        href="/profile/me"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Return to Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/profile/me" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
            </Link>

            <EventForm
                initialData={initialData}
                onSubmit={onSubmit}
                isLoading={isSaving}
                uploadingBanner={uploadingBanner}
                mode="edit"
            />
        </div>
    );
}
