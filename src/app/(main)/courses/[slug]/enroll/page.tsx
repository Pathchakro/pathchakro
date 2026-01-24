'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function EnrollmentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form
    const [method, setMethod] = useState('');
    const [verificationType, setVerificationType] = useState('transaction');
    const [transactionId, setTransactionId] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);

    const handleUpload = async (file: File): Promise<string | null> => {
        try {
            setUploading(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: file,
                headers: { 'content-type': file.type }
            });
            const data = await res.json();
            if (data.url) return data.url;
            throw new Error('Upload failed');
        } catch (error) {
            toast.error('Failed to upload screenshot');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!method) {
            toast.error('Please select a payment method');
            return;
        }

        let proofUrl = '';
        if (verificationType === 'screenshot') {
            if (!proofFile) {
                toast.error('Please select a screenshot');
                return;
            }
            const url = await handleUpload(proofFile);
            if (!url) return;
            proofUrl = url;
        } else if (verificationType === 'transaction') {
            if (!transactionId) {
                toast.error('Transaction ID is required');
                return;
            }
        } else if (verificationType === 'mobile') {
            if (!mobileNumber) {
                toast.error('Mobile Number is required');
                return;
            }
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/courses/slug/${slug}/enroll`, {
                method: 'POST',
                body: JSON.stringify({
                    method,
                    transactionId,
                    mobileNumber,
                    proofUrl
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Enrollment submitted! Waiting for approval.');
                router.push(`/courses/${slug}`);
            } else {
                toast.error(data.error || 'Enrollment failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" asChild>
                <Link href={`/courses/${slug}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                </Link>
            </Button>

            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Secure Your Seat</h1>
                <p className="text-muted-foreground">Scan the QR code and verify your payment to enroll.</p>
            </div>

            {/* QR Code Section */}
            <div className="flex justify-center">
                <div className="relative p-6 bg-white rounded-2xl shadow-lg border max-w-sm w-full text-center space-y-4">
                    <div className="relative aspect-square w-full">
                        <Image
                            src="/PaymentQr.jpg"
                            alt="Payment QR Code"
                            fill
                            className="object-contain rounded-lg"
                        />
                    </div>
                    <p className="text-sm font-medium text-gray-900 bg-gray-100 py-2 rounded-full">
                        Scan to Pay
                    </p>
                </div>
            </div>

            {/* Verification Form */}
            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle>Verify Payment</CardTitle>
                    <CardDescription>Enter your payment details to confirm enrollment.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bkash">Bkash</SelectItem>
                                    <SelectItem value="nagad">Nagad</SelectItem>
                                    <SelectItem value="rocket">Rocket</SelectItem>
                                    <SelectItem value="mcash">mCash</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Verification Mode</Label>
                            <RadioGroup
                                value={verificationType}
                                onValueChange={setVerificationType}
                                className="grid grid-cols-3 gap-3"
                            >
                                <div>
                                    <RadioGroupItem value="transaction" id="transaction" className="peer sr-only" />
                                    <Label
                                        htmlFor="transaction"
                                        className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                                    >
                                        <FileText className="mb-2 h-5 w-5" />
                                        <span className="text-xs font-semibold">Trx ID</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="mobile" id="mobile" className="peer sr-only" />
                                    <Label
                                        htmlFor="mobile"
                                        className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                                    >
                                        <Smartphone className="mb-2 h-5 w-5" />
                                        <span className="text-xs font-semibold">Mobile</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="screenshot" id="screenshot" className="peer sr-only" />
                                    <Label
                                        htmlFor="screenshot"
                                        className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                                    >
                                        <Upload className="mb-2 h-5 w-5" />
                                        <span className="text-xs font-semibold">Proof</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="min-h-[80px]">
                            {verificationType === 'transaction' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Transaction ID</Label>
                                    <Input
                                        placeholder="TrxID..."
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {verificationType === 'mobile' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Sender Mobile Number</Label>
                                    <Input
                                        placeholder="017..."
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {verificationType === 'screenshot' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Upload Screenshot</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Max 5MB. Formats: JPG, PNG</p>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={loading || uploading}>
                            {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {uploading ? 'Uploading Proof...' : loading ? 'Submitting...' : 'Confirm Enrollment'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
