'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, Upload, CreditCard, History, Trophy, Info, Smartphone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
    name: string;
    amount: number;
}

interface HistoryEntry {
    amount: number;
    status: string;
    createdAt: string;
    paymentMethod: string;
    transactionId?: string;
    donorName?: string;
    buyer?: { _id: string; name: string; image?: string };
}

export default function FundPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Data Stats
    const [totalBalance, setTotalBalance] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userHistory, setUserHistory] = useState<HistoryEntry[]>([]);

    // Form State
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('');
    const [verificationType, setVerificationType] = useState('transaction');
    const [transactionId, setTransactionId] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);

    useEffect(() => {
        fetchStats();
    }, [session]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/fund/stats');
            const data = await res.json();
            if (data.totalBalance !== undefined) {
                setTotalBalance(data.totalBalance);
                setLeaderboard(data.leaderboard);
                setUserHistory(data.userHistory);
            }
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('image', file); // API expects 'image'

        try {
            setUploading(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: file, // api/upload expects raw blob body if following typical pattern, wait... 
                // Checking previous api/upload finding: 
                // export async function POST(req: NextRequest) {
                //    const file = await req.blob();
                // ... }
                // YES, it expects the raw file in the body, NOT FormData wrapper if it reads req.blob() directly from body.
                // CORRECTION: Next.js req.blob() reads the entire body.
                headers: {
                    'content-type': file.type,
                }
            });
            const data = await res.json();
            if (data.url) return data.url;
            throw new Error(data.error || 'Upload failed');
        } catch (error) {
            toast.error('Failed to upload proof image');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            toast.error('Please login to donate');
            return;
        }

        if (!amount || !method) {
            toast.error('Please fill in required fields');
            return;
        }

        setSubmitting(true);
        let proofUrl = '';

        if (verificationType === 'screenshot') {
            if (!proofFile) {
                toast.error('Please select a screenshot');
                setSubmitting(false);
                return;
            }
            const url = await handleUpload(proofFile);
            if (!url) {
                setSubmitting(false);
                return;
            }
            proofUrl = url;
        } else if (verificationType === 'transaction') {
            if (!transactionId) {
                toast.error('Please enter Transaction ID');
                setSubmitting(false);
                return;
            }
        } else if (verificationType === 'mobile') {
            if (!mobileNumber) {
                toast.error('Please enter Mobile Number');
                setSubmitting(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/fund/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    method,
                    verificationType,
                    proofUrl,
                    transactionId,
                    mobileNumber,
                    accountNumber
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Donation submitted! It is pending approval.');
                // Reset form
                setAmount('');
                setTransactionId('');
                setMobileNumber('');
                setAccountNumber('');
                setProofFile(null);
                // Refresh history
                fetchStats();
            } else {
                toast.error(data.error || 'Submission failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container max-w-6xl py-10 space-y-10">
            {/* Hero Section */}
            <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        Help Us Run the Community
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Your contribution helps us maintain servers, organize events, and support open source development.
                        Every Taka counts!
                    </p>
                    <div className="p-6 bg-card border rounded-2xl shadow-sm space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                        <p className="text-4xl font-bold">৳ {totalBalance.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="relative p-4 bg-white rounded-2xl shadow-lg border max-w-xs w-full text-center space-y-4">
                        <div className="relative aspect-square w-full">
                            <Image
                                src="/PaymentQr.jpg"
                                alt="Payment QR Code"
                                fill
                                className="object-contain rounded-lg"
                            />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Scan to Pay via Bkash/Nagad/Rocket</p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Main Content Tabs */}
            <Tabs defaultValue="verify" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                    <TabsTrigger value="verify">Verify Payment</TabsTrigger>
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                    <TabsTrigger value="apply">Apply for Fund</TabsTrigger>
                </TabsList>

                {/* Verify Payment Tab */}
                <TabsContent value="verify" className="max-w-2xl mx-auto">
                    {userHistory.some(h => h.status === 'pending') ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 p-6 rounded-lg text-center space-y-3">
                            <Info className="h-10 w-10 text-yellow-600 mx-auto" />
                            <h3 className="font-semibold text-lg text-yellow-800 dark:text-yellow-400">Verification Pending</h3>
                            <p className="text-muted-foreground">
                                You currently have a pending donation verification.
                                Please wait to approve or reject your request before submitting a new one.
                            </p>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit Payment Details</CardTitle>
                                <CardDescription>
                                    After sending money to the QR code, fill this form to track your donation.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Amount (BDT)</Label>
                                        <Input
                                            type="number"
                                            placeholder="500"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <Select value={method} onValueChange={setMethod} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bkash">Bkash</SelectItem>
                                                <SelectItem value="nagad">Nagad</SelectItem>
                                                <SelectItem value="rocket">Rocket</SelectItem>
                                                <SelectItem value="mcash">mCash</SelectItem>
                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

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
                                                    <span className="text-xs font-semibold">Mobile No</span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="screenshot" id="screenshot" className="peer sr-only" />
                                                <Label
                                                    htmlFor="screenshot"
                                                    className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                                                >
                                                    <Upload className="mb-2 h-5 w-5" />
                                                    <span className="text-xs font-semibold">Screenshot</span>
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

                                    <Button type="submit" className="w-full" size="lg" disabled={submitting || uploading}>
                                        {(submitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {uploading ? 'Uploading Proof...' : submitting ? 'Submitting...' : 'Confirm Donation'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* User History Section */}
                    {session?.user && userHistory.length > 0 && (
                        <div className="mt-10 space-y-4">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Your History</h3>
                            </div>
                            <div className="space-y-3">
                                {userHistory.map((trx, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar logic: Use buyer image or fallback */}
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={trx.buyer?.image} alt={trx.donorName || 'Donor'} />
                                                <AvatarFallback>{(trx.donorName?.[0] || trx.buyer?.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {trx.buyer?._id ? (
                                                        <Link href={`/profile/${trx.buyer._id}`} className="hover:underline hover:text-primary transition-colors">
                                                            {trx.donorName || trx.buyer.name}
                                                        </Link>
                                                    ) : (
                                                        <span>{trx.donorName || 'Anonymous'}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    {new Date(trx.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                    {` • ${trx.paymentMethod.toUpperCase()}`}
                                                    {trx.transactionId && ` • ${trx.transactionId}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">৳ {trx.amount}</p>
                                            <Badge variant={trx.status === 'completed' ? 'default' : trx.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">
                                                {trx.status === 'completed' ? 'Funded' : trx.status === 'failed' ? 'Canceled' : trx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-6 w-6 text-yellow-500" />
                                Top Contributors
                            </CardTitle>
                            <CardDescription>
                                Hall of fame for our generous supporters.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-3 rounded-l-lg">Rank</th>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3 text-right rounded-r-lg">Total Donated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                                </td>
                                            </tr>
                                        ) : leaderboard.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No donations yet. Be the first!
                                                </td>
                                            </tr>
                                        ) : (
                                            leaderboard.map((user, index) => (
                                                <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-foreground">
                                                        {user.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono">
                                                        ৳ {user.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Apply for Fund Tab */}

                {/* Apply for Fund Tab */}
                <TabsContent value="apply">
                    <FundApplicationForm session={session} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function FundApplicationForm({ session }: { session: any }) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState(''); // JSON string
    const [submitting, setSubmitting] = useState(false);

    // Dynamic import for NovelEditor with Client Side only rendering
    const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), {
        ssr: false,
        loading: () => <div className="h-[300px] w-full border rounded-lg bg-muted animate-pulse" />
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            toast.error('Please login to apply');
            return;
        }

        if (!title || !amount) {
            toast.error('Please fill in title and amount');
            return;
        }

        if (!description || description === '{}') {
            toast.error('Please provide a description');
            return;
        }

        // Basic check if description is empty JSON content if possible, but strict check is hard on string.
        // We rely on visual cue to user.

        setSubmitting(true);
        try {
            const res = await fetch('/api/fund/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    amount,
                    description // passing the stringified JSON directly
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Application submitted successfully!');
                setTitle('');
                setAmount('');
                setDescription('');
            } else {
                toast.error(data.error || 'Submission failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apply for Funding</CardTitle>
                <CardDescription>
                    Describe your project or need in detail. Applications are reviewed by the admin team.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Project Title</Label>
                        <Input
                            placeholder="e.g. Winter Cloth Distribution"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Amount Requested (BDT)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 5000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Detailed Description</Label>
                        <div className="min-h-[300px] border rounded-lg overflow-hidden">
                            {/* NovelEditor component handles the rich text input */}
                            <NovelEditor
                                onChange={(val: string) => setDescription(val)}
                                initialValue={undefined}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Explain why you need the funds, how they will be used, and the expected impact.
                        </p>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? 'Submitting Application...' : 'Submit Application'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
