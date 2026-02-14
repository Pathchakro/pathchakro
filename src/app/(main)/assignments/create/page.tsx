'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { ProfileCompletionModal } from '@/components/auth/ProfileCompletionModal';

const assignmentSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    dueDate: z.string().min(1, 'Due date is required'),
    totalPoints: z.number().min(1, 'Points must be at least 1').max(1000, 'Points cannot exceed 1000'),
});

type AssignmentData = z.infer<typeof assignmentSchema>;

export default function CreateAssignmentPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const { checkAuth, showProfileModal, setShowProfileModal, isAuthorized, isLoading } = useAuthProtection({
        requireProfileCompletion: true,
        requireAuth: true
    });

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AssignmentData>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            totalPoints: 100,
        },
    });

    const onSubmit = async (data: AssignmentData) => {
        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to create assignment');
                return;
            }

            router.push(`/assignments/${result.assignment._id}`);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalOpenChange = (open: boolean) => {
        setShowProfileModal(open);
        if (!open && !isAuthorized) {
            router.push('/assignments');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <ProfileCompletionModal
                open={showProfileModal}
                onOpenChange={handleModalOpenChange}
            />
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/assignments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Assignments
            </Link>

            <ProfileCompletionModal
                open={showProfileModal}
                onOpenChange={setShowProfileModal}
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Create Assignment</CardTitle>
                            <CardDescription>
                                Create a new assignment for students
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
                            <Label htmlFor="title">Assignment Title *</Label>
                            <Input
                                id="title"
                                placeholder="Write an essay on..."
                                {...register('title')}
                                disabled={submitting}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description & Instructions *</Label>
                            <Textarea
                                id="description"
                                placeholder="Provide detailed instructions for students..."
                                rows={6}
                                {...register('description')}
                                disabled={submitting}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date *</Label>
                                <Input
                                    id="dueDate"
                                    type="datetime-local"
                                    {...register('dueDate')}
                                    disabled={submitting}
                                />
                                {errors.dueDate && (
                                    <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalPoints">Total Points *</Label>
                                <Input
                                    id="totalPoints"
                                    type="number"
                                    min="1"
                                    max="1000"
                                    {...register('totalPoints', { valueAsNumber: true })}
                                    disabled={submitting}
                                />
                                {errors.totalPoints && (
                                    <p className="text-sm text-red-500">{errors.totalPoints.message}</p>
                                )}
                            </div>
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
                                disabled={submitting}
                                className="flex-1"
                            >
                                {submitting ? 'Creating...' : 'Create Assignment'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
