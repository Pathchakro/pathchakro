'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Upload, CreditCard, History, Trophy, Info, Smartphone, FileText, ArrowRight } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), { ssr: false });

interface FundClientProps {
    initialStats: {
        totalBalance: number;
        userHistory: any[];
        leaderboard: { name: string; amount: number }[];
    };
    session: any;
}

export default function FundClient({ initialStats, session }: FundClientProps) {
    const router = useRouter();
    const [stats] = useState(initialStats);
    const [submitting, setSubmitting] = useState(false);

    // Donation state
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('');
    const [verificationType, setVerificationType] = useState('transaction');
    const [transactionId, setTransactionId] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    // Application state
    const [appTitle, setAppTitle] = useState('');
    const [appAmount, setAppAmount] = useState('');
    const [appDesc, setAppDesc] = useState('');

    const handleDonate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return toast.error("Please sign in to donate");

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return toast.error("Please enter a valid positive amount");
        }

        if (!method) return toast.error("Please select a payment method");

        if (verificationType === 'transaction' && !transactionId.trim()) {
            return toast.error("Please enter the Transaction ID");
        }
        if (verificationType === 'mobile' && !mobileNumber.trim()) {
            return toast.error("Please enter your Mobile Number");
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/fund/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: parsedAmount, 
                    method, 
                    verificationType, 
                    transactionId: transactionId.trim(), 
                    mobileNumber: mobileNumber.trim() 
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Payment details submitted for verification!");
                setAmount('');
                setTransactionId('');
                setMobileNumber('');
                router.refresh();
            } else {
                toast.error(data.error || data.message || `Failed to submit donation (${res.status})`);
            }
        } catch (error: any) { 
            toast.error(error?.message || "Something went wrong while submitting donation"); 
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return toast.error("Please sign in to apply for funding");

        const parsedAmount = parseFloat(appAmount);
        if (!appTitle.trim()) return toast.error("Project title is required");
        if (isNaN(parsedAmount) || parsedAmount < 1) return toast.error("Application amount must be at least ৳1");
        if (!appDesc.trim()) return toast.error("Project description is required");

        setSubmitting(true);
        try {
            const res = await fetch('/api/fund/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: appTitle.trim(), 
                    amount: parsedAmount, 
                    description: appDesc.trim() 
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Application submitted successfully!");
                setAppTitle('');
                setAppAmount('');
                setAppDesc('');
                router.refresh();
            } else {
                toast.error(data.error || data.message || `Failed to send application (${res.status})`);
            }
        } catch (error: any) { 
            toast.error(error?.message || "Something went wrong while sending application"); 
        } finally { 
            setSubmitting(false); 
        }
    };

    return (
        <div className="container max-w-6xl py-10 space-y-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-indigo-600 leading-tight">Help Us Run the Community</h1>
                    <div className="p-8 bg-card border-2 border-primary/10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Raised</p>
                        <p className="text-5xl font-black text-foreground">৳ {stats.totalBalance.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="relative p-6 bg-white rounded-3xl shadow-2xl border-4 border-primary/5 max-w-xs w-full text-center space-y-4 group">
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner bg-muted/20">
                            <Image src="/PaymentQr.jpg" alt="Payment QR" fill className="object-contain group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Scan with Bkash/Nagad</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="verify" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-10 bg-muted/50 p-1.5 rounded-2xl">
                    <TabsTrigger value="verify" className="rounded-xl font-bold">Verify Payment</TabsTrigger>
                    <TabsTrigger value="leaderboard" className="rounded-xl font-bold">Leaderboard</TabsTrigger>
                    <TabsTrigger value="apply" className="rounded-xl font-bold">Apply</TabsTrigger>
                </TabsList>

                <TabsContent value="verify" className="max-w-2xl mx-auto">
                    <Card className="border-2 shadow-lg rounded-3xl overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <Smartphone className="h-6 w-6 text-primary" />
                                Submit Payment Details
                            </CardTitle>
                            <CardDescription>Enter the details from your Bkash/Nagad transaction.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleDonate} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Amount (৳)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="Min: ৳1" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)} 
                                        required 
                                        min="1"
                                        className="h-12 rounded-xl border-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Payment Method</Label>
                                    <Select value={method} onValueChange={setMethod} required>
                                        <SelectTrigger className="h-12 rounded-xl border-2">
                                            <SelectValue placeholder="Select Method" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="bkash">Bkash</SelectItem>
                                            <SelectItem value="nagad">Nagad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Verification Method</Label>
                                    <RadioGroup value={verificationType} onValueChange={setVerificationType} className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <RadioGroupItem value="transaction" id="tr" className="sr-only" />
                                            <Label 
                                                htmlFor="tr" 
                                                className={`flex items-center justify-center border-2 p-4 h-12 rounded-xl cursor-pointer transition-all font-bold ${verificationType === 'transaction' ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/20'}`}
                                            >
                                                Transaction ID
                                            </Label>
                                        </div>
                                        <div className="relative">
                                            <RadioGroupItem value="mobile" id="mo" className="sr-only" />
                                            <Label 
                                                htmlFor="mo" 
                                                className={`flex items-center justify-center border-2 p-4 h-12 rounded-xl cursor-pointer transition-all font-bold ${verificationType === 'mobile' ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/20'}`}
                                            >
                                                Mobile Number
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                
                                {verificationType === 'transaction' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="font-bold ml-1">Transaction ID</Label>
                                        <Input 
                                            placeholder="e.g. 9K2L4M6N8P" 
                                            value={transactionId} 
                                            onChange={(e) => setTransactionId(e.target.value)} 
                                            required={verificationType === 'transaction'}
                                            className="h-12 rounded-xl border-2"
                                        />
                                    </div>
                                )}
                                {verificationType === 'mobile' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="font-bold ml-1">Your Mobile Number</Label>
                                        <Input 
                                            placeholder="e.g. 017XXXXXXXX" 
                                            value={mobileNumber} 
                                            onChange={(e) => setMobileNumber(e.target.value)} 
                                            required={verificationType === 'mobile'}
                                            className="h-12 rounded-xl border-2"
                                        />
                                    </div>
                                )}
                                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all" disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                    {submitting ? 'Verifying...' : 'Confirm Payment'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {stats.userHistory.length > 0 && (
                        <div className="mt-12 space-y-6">
                            <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-tight">
                                <History className="h-6 w-6 text-primary" /> 
                                Your History
                            </h3>
                            <div className="space-y-3">
                                {stats.userHistory.map((trx: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-card border-2 rounded-2xl hover:border-primary/20 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <CreditCard className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">{trx.donorName || 'Community Member'}</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{new Date(trx.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg">৳ {trx.amount}</p>
                                            <Badge variant={trx.status === 'completed' ? 'default' : 'outline'} className="capitalize rounded-lg text-[10px] font-black">{trx.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="leaderboard">
                    <Card className="border-2 shadow-lg rounded-3xl overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <Trophy className="h-6 w-6 text-yellow-500" />
                                Hall of Fame
                            </CardTitle>
                            <CardDescription>Our top contributors who keep Pathchakro alive.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="overflow-hidden border-2 rounded-2xl">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b-2">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-10 px-4">
                                            <th className="text-left pl-6">Rank</th>
                                            <th className="text-left">User</th>
                                            <th className="text-right pr-6">Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2">
                                        {stats.leaderboard.map((u: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/10 transition-colors group">
                                                <td className="h-14 pl-6">
                                                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'bg-muted/50'}`}>
                                                        #{i + 1}
                                                    </span>
                                                </td>
                                                <td className="font-bold text-base group-hover:text-primary transition-colors">{u.name}</td>
                                                <td className="text-right pr-6 font-black text-lg text-primary">৳ {u.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="apply" className="max-w-2xl mx-auto">
                    <Card className="border-2 shadow-lg rounded-3xl overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                Apply for Funding
                            </CardTitle>
                            <CardDescription>Tell us about your project and how much support you need.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleApply} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Project Title</Label>
                                    <Input 
                                        placeholder="What are you building?" 
                                        value={appTitle} 
                                        onChange={(e) => setAppTitle(e.target.value)} 
                                        required 
                                        className="h-12 rounded-xl border-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Required Amount (৳)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="Min: ৳1" 
                                        value={appAmount} 
                                        onChange={(e) => setAppAmount(e.target.value)} 
                                        required 
                                        min="1"
                                        className="h-12 rounded-xl border-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold ml-1">Project Description</Label>
                                    <div className="min-h-[200px] border-2 rounded-2xl overflow-hidden bg-card focus-within:ring-2 ring-primary transition-all">
                                        <NovelEditor onChange={setAppDesc} initialValue={undefined} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium ml-1">Provide a detailed explanation of your funding request.</p>
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all" disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                                    {submitting ? 'Submitting...' : 'Send Application'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
