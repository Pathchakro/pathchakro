'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTeamSchema, type CreateTeamData } from '@/lib/validations/team';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateTeamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreateTeamData>({
        resolver: zodResolver(createTeamSchema),
        defaultValues: {
            privacy: 'public',
        },
    });

    const selectedType = watch('type');

    const onSubmit = async (data: CreateTeamData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to create team');
                return;
            }

            router.push(`/teams/${result.team._id}`);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Teams
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Create a Team</CardTitle>
                            <CardDescription>
                                Build a community around your interests or location
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
                            <Label htmlFor="name">Team Name *</Label>
                            <Input
                                id="name"
                                placeholder="Dhaka University Book Club"
                                {...register('name')}
                                disabled={isLoading}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Tell people what this team is about..."
                                rows={4}
                                {...register('description')}
                                disabled={isLoading}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Team Type *</Label>
                                <Select
                                    id="type"
                                    {...register('type')}
                                    disabled={isLoading}
                                >
                                    <option value="">Select type</option>
                                    <option value="University">University</option>
                                    <option value="Thana">Thana/Location</option>
                                    <option value="Special">Special Interest</option>
                                </Select>
                                {errors.type && (
                                    <p className="text-sm text-red-500">{errors.type.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="privacy">Privacy *</Label>
                                <Select
                                    id="privacy"
                                    {...register('privacy')}
                                    disabled={isLoading}
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </Select>
                                {errors.privacy && (
                                    <p className="text-sm text-red-500">{errors.privacy.message}</p>
                                )}
                            </div>
                        </div>

                        {selectedType === 'University' && (
                            <div className="space-y-2">
                                <Label htmlFor="university">University Name</Label>
                                <Input
                                    id="university"
                                    placeholder="e.g., Dhaka University"
                                    {...register('university')}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {(selectedType === 'Thana' || selectedType === 'University') && (
                            <div className="space-y-2">
                                <Label htmlFor="location">Location/Thana</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Dhanmondi, Gulshan"
                                    {...register('location')}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

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
                                {isLoading ? 'Creating...' : 'Create Team'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
