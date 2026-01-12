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
import { Droplet, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';

const donorSchema = z.object({
    bloodGroup: z.string().min(1, 'Blood group is required'),
    location: z.string().min(3, 'Location is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    lastDonationDate: z.string().optional(),
    willingToTravel: z.boolean().optional(),
    maxTravelDistance: z.number().optional(),
    notes: z.string().optional(),
});

type DonorData = z.infer<typeof donorSchema>;

export default function RegisterDonorPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [willingToTravel, setWillingToTravel] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<DonorData>({
        resolver: zodResolver(donorSchema),
    });

    const onSubmit = async (data: DonorData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/blood-donors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    willingToTravel,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to register');
                return;
            }

            alert(result.message);
            router.push('/blood-donors');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/blood-donors" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Donors
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                            <Droplet className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Register as Blood Donor</CardTitle>
                            <CardDescription>
                                Help save lives by registering as a blood donor
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup">Blood Group *</Label>
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    placeholder="+880 1XXXXXXXXX"
                                    {...register('phone')}
                                    disabled={isLoading}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location/Area *</Label>
                            <Input
                                id="location"
                                placeholder="e.g., Dhanmondi, Dhaka"
                                {...register('location')}
                                disabled={isLoading}
                            />
                            {errors.location && (
                                <p className="text-sm text-red-500">{errors.location.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastDonationDate">Last Donation Date (Optional)</Label>
                            <Input
                                id="lastDonationDate"
                                type="date"
                                {...register('lastDonationDate')}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="willingToTravel"
                                    checked={willingToTravel}
                                    onChange={(e) => setWillingToTravel(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="willingToTravel" className="cursor-pointer">
                                    I am willing to travel to donate blood
                                </Label>
                            </div>

                            {willingToTravel && (
                                <div className="space-y-2 ml-6">
                                    <Label htmlFor="maxTravelDistance">Maximum Travel Distance (km)</Label>
                                    <Input
                                        id="maxTravelDistance"
                                        type="number"
                                        min="1"
                                        max="100"
                                        placeholder="e.g., 10"
                                        {...register('maxTravelDistance', { valueAsNumber: true })}
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Any additional information you'd like to share..."
                                rows={3}
                                {...register('notes')}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• You must be 18-65 years old to donate blood</li>
                                <li>• Wait at least 3 months between donations</li>
                                <li>• Be in good health and weigh at least 50 kg</li>
                                <li>• Your contact information will be visible to those searching for donors</li>
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
                                {isLoading ? 'Registering...' : 'Register as Donor'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
