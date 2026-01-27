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
            const response = await fetch(`/api/events/${eventSlug}`);
            const data = await response.json();

            if (data.event) {
                setInitialData(data.event);
            } else {
                toast.error('Event not found');
                router.push('/events');
            }
        } catch (error) {
            console.error('Error fetching event:', error);
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
        return <div className="p-8 text-center">Loading event details...</div>;
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
