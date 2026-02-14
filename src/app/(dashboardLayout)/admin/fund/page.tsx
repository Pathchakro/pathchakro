'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select-radix';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Eye, ExternalLink, DollarSign, Filter, TrendingUp, HandCoins, GraduationCap, Plane } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { generateHtml } from '@/lib/server-html';

export default function AdminFundPage() {
    const { data: session } = useSession();

    // Unified Data
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalFund: 0, donation: 0, course: 0, tour: 0 });

    // Applications (Withdrawals)
    const [applications, setApplications] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedApp, setSelectedApp] = useState<any>(null);

    useEffect(() => {
        fetchUnifiedData();
        fetchApplications(); // We keep this separate or merge if API supports it, separate for now as logic differs
    }, []);

    const fetchUnifiedData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/unified-fund');
            const data = await res.json();
            if (data.transactions) {
                setTransactions(data.transactions);
                setStats(data.summary);
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to load fund data');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        // Reuse old endpoint for applications part, or separate fetch
        // Assuming /api/admin/fund still returns applications if we didn't break it.
        // Wait, I didn't verify if I should keep /api/admin/fund working for applications.
        // I should probably ensure the old endpoint still serves applications or create a new one.
        // For now let's assume /api/admin/fund works or I just fetch it here.
        // Actually, let's just use the old endpoint for applications storage if it's there.
        try {
            const res = await fetch('/api/admin/fund');
            const data = await res.json();
            if (data.applications) {
                setApplications(data.applications);
            }
        } catch (error) {
            console.error("Failed to load applications", error);
        }
    };

    const handleAction = async (type: string, id: string, action: string) => {
        // For unified transactions
        if (['donation', 'course', 'tour'].includes(type)) {
            try {
                const res = await fetch('/api/admin/unified-fund/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, id, action }),
                });
                const data = await res.json();
                if (res.ok) {
                    toast.success(data.message);
                    fetchUnifiedData();
                } else {
                    toast.error(data.error || 'Action failed');
                }
            } catch (error) {
                toast.error('Something went wrong');
            }
        }
        // For Applications (Withdrawals) - using old logic
        else if (type === 'application') {
            try {
                const res = await fetch('/api/admin/fund/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, id, action }),
                });
                const data = await res.json();
                if (res.ok) {
                    toast.success(data.message);
                    fetchApplications();
                    if (selectedApp?._id === id) {
                        setSelectedApp({ ...selectedApp, status: action === 'approve' ? 'approved' : action === 'disburse' ? 'disbursed' : 'rejected' });
                    }
                } else {
                    toast.error(data.error || 'Action failed');
                }
            } catch (error) {
                toast.error('Something went wrong');
            }
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const typeMatch = filterType === 'all' || t.type === filterType;
        const statusMatch = filterStatus === 'all' || t.status === filterStatus;
        return typeMatch && statusMatch;
    });

    if (loading && transactions.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container py-8 max-w-7xl space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Finance Dashboard</h1>
                    <p className="text-muted-foreground">Overview of all incoming funds and withdrawal requests.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Fund Collected</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">৳ {stats.totalFund.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Donations</CardDescription>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            ৳ {stats.donation.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Course Fees</CardDescription>
                        <CardTitle className="text-2xl font-bold">৳ {stats.course.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Tour Fees</CardDescription>
                        <CardTitle className="text-2xl font-bold">৳ {stats.tour.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Plane className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="inflow">
                <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
                    <TabsTrigger value="inflow">Inflow (Payments)</TabsTrigger>
                    <TabsTrigger value="outflow">Outflow (Requests)</TabsTrigger>
                </TabsList>

                {/* INFLOW TAB */}
                <TabsContent value="inflow" className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <div className="w-[180px]">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="donation">Donations</SelectItem>
                                    <SelectItem value="course">Courses</SelectItem>
                                    <SelectItem value="tour">Tours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[180px]">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed/Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => { setFilterType('all'); setFilterStatus('all'); }}>
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransactions.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(t.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{t.user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{t.user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <Badge variant="outline" className="w-fit mb-1 capitalize text-[10px]">{t.type}</Badge>
                                                        <span className="text-xs font-medium truncate max-w-[150px]" title={t.source}>{t.source}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono font-medium">
                                                    ৳{t.amount}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs text-muted-foreground">
                                                        <span className="capitalize">{t.payment.method}</span>
                                                        <span className="font-mono">{t.payment.trxId || '-'}</span>
                                                        {t.payment.proof && (
                                                            <a href={t.payment.proof} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                                                <Eye className="h-3 w-3" /> Proof
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={t.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {t.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleAction(t.type, t.id, 'approve')}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleAction(t.type, t.id, 'reject')}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* OUTFLOW TAB (Applications) */}
                <TabsContent value="outflow">
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal / Fund Requests</CardTitle>
                            <CardDescription>Applications for funding from community members.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applications.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        applications.map((app) => (
                                            <TableRow key={app._id}>
                                                <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{app.applicant?.name}</span>
                                                        <span className="text-xs text-muted-foreground">{app.applicant?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={app.title}>{app.title}</TableCell>
                                                <TableCell className="font-mono">৳{app.amountRequested}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={app.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" onClick={() => setSelectedApp(app)}>Review</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>{app.title}</DialogTitle>
                                                                <DialogDescription>
                                                                    Requested by {app.applicant?.name} • ৳{app.amountRequested}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="prose prose-sm dark:prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: generateHtml(app.description) }} />
                                                            <div className="flex justify-end gap-3 mt-4">
                                                                {app.status === 'pending' && (
                                                                    <>
                                                                        <Button variant="destructive" onClick={() => handleAction('application', app._id, 'reject')}>Reject</Button>
                                                                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('application', app._id, 'approve')}>Approve</Button>
                                                                    </>
                                                                )}
                                                                {app.status === 'approved' && (
                                                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('application', app._id, 'disburse')}>
                                                                        <DollarSign className="mr-2 h-4 w-4" /> Disburse
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";

    switch (status) {
        case 'completed':
        case 'confirmed':
        case 'disbursed':
            variant = "default";
            className = "bg-green-500 hover:bg-green-600 border-transparent text-white";
            break;
        case 'approved':
            variant = "default";
            className = "bg-blue-500 hover:bg-blue-600 border-transparent text-white";
            break;
        case 'pending':
            variant = "secondary";
            className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
            break;
        case 'failed':
        case 'rejected':
        case 'refunded':
        case 'cancelled':
            variant = "destructive";
            break;
    }

    return (
        <Badge variant={variant} className={className + " capitalize"}>
            {status}
        </Badge>
    );
}
