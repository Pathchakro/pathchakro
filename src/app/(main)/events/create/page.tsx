'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { EventForm, EventData } from '@/components/events/EventForm';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useEffect } from 'react';

export default function CreateEventPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { checkVerifiedAccess } = useAccessControl();

    useEffect(() => {
        checkVerifiedAccess(true);
    }, [checkVerifiedAccess]);

    const [uploadingBanner, setUploadingBanner] = useState(false);

    const onSubmit = async (data: EventData, bannerFile: File | null) => {
        setIsLoading(true);

        try {
            let bannerUrl = '';

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

            const response = await fetch('/api/events', {
                method: 'POST',
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
                toast.error(result.error || 'Failed to create event');
                return;
            }

            toast.success('Event created successfully!');
            router.push(`/events/${result.event.slug || result.event._id}`);
        } catch (err: any) {
            toast.error(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
            setUploadingBanner(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
            </Link>

            <EventForm
                onSubmit={onSubmit}
                isLoading={isLoading}
                uploadingBanner={uploadingBanner}
                mode="create"
            />
        </div>
    );
}
