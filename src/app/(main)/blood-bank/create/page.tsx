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

const bloodRequestSchema = z.object({
    patientName: z.string().min(2, 'Patient name is required'),
    bloodType: z.string().min(1, 'Blood type is required'),
    unitsNeeded: z.number().min(1).max(10),
    urgency: z.enum(['critical', 'urgent', 'normal']),
    location: z.string().min(3, 'Location is required'),
    hospital: z.string().min(3, 'Hospital name is required'),
    contactNumber: z.string().min(10, 'Valid contact number is required'),
    additionalInfo: z.string().optional(),
});

type BloodRequestData = z.infer<typeof bloodRequestSchema>;

export default function CreateBloodRequestPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BloodRequestData>({
        resolver: zodResolver(bloodRequestSchema),
        defaultValues: {
            urgency: 'normal',
            unitsNeeded: 1,
        },
    });

    const onSubmit = async (data: BloodRequestData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/blood-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to create request');
                return;
            }

            router.push('/blood-donation');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/blood-donation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Blood Donation
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                            <Droplet className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Create Blood Request</CardTitle>
                            <CardDescription>
                                Help find blood donors for someone in need
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
                                <Label htmlFor="patientName">Patient Name *</Label>
                                <Input
                                    id="patientName"
                                    placeholder="John Doe"
                                    {...register('patientName')}
                                    disabled={isLoading}
                                />
                                {errors.patientName && (
                                    <p className="text-sm text-red-500">{errors.patientName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodType">Blood Type *</Label>
                                <Select
                                    id="bloodType"
                                    {...register('bloodType')}
                                    disabled={isLoading}
                                >
                                    <option value="">Select blood type</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </Select>
                                {errors.bloodType && (
                                    <p className="text-sm text-red-500">{errors.bloodType.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unitsNeeded">Units Needed *</Label>
                                <Input
                                    id="unitsNeeded"
                                    type="number"
                                    min="1"
                                    max="10"
                                    {...register('unitsNeeded', { valueAsNumber: true })}
                                    disabled={isLoading}
                                />
                                {errors.unitsNeeded && (
                                    <p className="text-sm text-red-500">{errors.unitsNeeded.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="urgency">Urgency Level *</Label>
                                <Select
                                    id="urgency"
                                    {...register('urgency')}
                                    disabled={isLoading}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="critical">Critical</option>
                                </Select>
                                {errors.urgency && (
                                    <p className="text-sm text-red-500">{errors.urgency.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hospital">Hospital Name *</Label>
                            <Input
                                id="hospital"
                                placeholder="Dhaka Medical College Hospital"
                                {...register('hospital')}
                                disabled={isLoading}
                            />
                            {errors.hospital && (
                                <p className="text-sm text-red-500">{errors.hospital.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location/Area *</Label>
                            <Input
                                id="location"
                                placeholder="Dhanmondi, Dhaka"
                                {...register('location')}
                                disabled={isLoading}
                            />
                            {errors.location && (
                                <p className="text-sm text-red-500">{errors.location.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactNumber">Contact Number *</Label>
                            <Input
                                id="contactNumber"
                                type="tel"
                                placeholder="+880 1XXXXXXXXX"
                                {...register('contactNumber')}
                                disabled={isLoading}
                            />
                            {errors.contactNumber && (
                                <p className="text-sm text-red-500">{errors.contactNumber.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                            <Textarea
                                id="additionalInfo"
                                placeholder="Any additional details that might help donors..."
                                rows={4}
                                {...register('additionalInfo')}
                                disabled={isLoading}
                            />
                            {errors.additionalInfo && (
                                <p className="text-sm text-red-500">{errors.additionalInfo.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Request will automatically expire after 7 days
                            </p>
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
                                className="flex-1 bg-red-500 hover:bg-red-600"
                            >
                                {isLoading ? 'Creating...' : 'Create Request'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
