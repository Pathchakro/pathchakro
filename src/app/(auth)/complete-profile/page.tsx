'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { profileCompletionSchema, type ProfileCompletionData } from '@/lib/validations/profile';
import { BookOpen, Check } from 'lucide-react';

const BOOK_CATEGORIES = [
    'Finance',
    'Economics',
    'History',
    'Literature',
    'Religious',
    'Science',
    'Technology',
    'Arts',
    'Other',
];

export default function CompleteProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProfileCompletionData>({
        resolver: zodResolver(profileCompletionSchema),
        defaultValues: {
            bookPreferences: [],
        },
    });

    const toggleCategory = (category: string) => {
        const updated = selectedCategories.includes(category)
            ? selectedCategories.filter((c) => c !== category)
            : [...selectedCategories, category];

        setSelectedCategories(updated);
        setValue('bookPreferences', updated);
    };

    const onSubmit = async (data: ProfileCompletionData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/profile/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to update profile');
                return;
            }

            router.push('/feed');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                    <CardDescription>
                        Tell us more about yourself and your reading interests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Profile Picture Upload */}
                        <div className="space-y-2">
                            <Label>Profile Picture (Optional)</Label>
                            <div className="flex justify-center">
                                <ImageUploader
                                    onUpload={setProfileImage}
                                    currentImage={profileImage}
                                    variant="avatar"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio (Optional)</Label>
                            <Textarea
                                id="bio"
                                placeholder="Tell us about yourself and your reading interests..."
                                rows={4}
                                {...register('bio')}
                                disabled={isLoading}
                            />
                            {errors.bio && (
                                <p className="text-sm text-red-500">{errors.bio.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                You can use rich text editor features in your profile later
                            </p>
                        </div>

                        {/* Blood Group */}
                        <div className="space-y-2">
                            <Label htmlFor="bloodGroup">Blood Group (Optional)</Label>
                            <Select
                                id="bloodGroup"
                                {...register('bloodGroup')}
                                disabled={isLoading}
                            >
                                <option value="">Select blood group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </Select>
                            {errors.bloodGroup && (
                                <p className="text-sm text-red-500">{errors.bloodGroup.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                This will help with our blood donation feature
                            </p>
                        </div>

                        {/* Book Preferences */}
                        <div className="space-y-2">
                            <Label>Book Categories (Select at least one)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {BOOK_CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className={`
                      relative px-4 py-2 rounded-lg border-2 transition-all
                      ${selectedCategories.includes(category)
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }
                    `}
                                        disabled={isLoading}
                                    >
                                        <span className="text-sm font-medium">{category}</span>
                                        {selectedCategories.includes(category) && (
                                            <Check className="absolute top-1 right-1 h-4 w-4" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {errors.bookPreferences && (
                                <p className="text-sm text-red-500">{errors.bookPreferences.message}</p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push('/feed')}
                                disabled={isLoading}
                            >
                                Skip for now
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Complete Profile'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
