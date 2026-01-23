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
import { Loader2, Check, X, Eye, ExternalLink, DollarSign } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), {
    ssr: false,
    loading: () => <p>Loading content...</p>
});

export default function AdminFundPage() {
    const { data: session } = useSession();
    const [donations, setDonations] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedApp, setSelectedApp] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/fund');
            const data = await res.json();
            if (data.donations) {
                setDonations(data.donations);
                setApplications(data.applications);
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type: 'donation' | 'application', id: string, action: string) => {
        try {
            const res = await fetch('/api/admin/fund/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id, action }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                fetchData(); // Refresh data
                if (type === 'application' && selectedApp?._id === id) {
                    setSelectedApp({ ...selectedApp, status: action === 'approve' ? 'approved' : action === 'disburse' ? 'disbursed' : 'rejected' });
                }
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    const filteredDonations = donations.filter(d => filterStatus === 'all' || d.status === filterStatus);
    const filteredApplications = applications.filter(a => filterStatus === 'all' || a.status === filterStatus);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Fund Management</h1>
                    <p className="text-muted-foreground">Manage donations and funding applications</p>
                </div>
                <div className="w-[200px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed/Approved</SelectItem>
                            <SelectItem value="approved">Approved (Apps Only)</SelectItem>
                            <SelectItem value="disbursed">Disbursed</SelectItem>
                            <SelectItem value="failed">Failed/Rejected</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="donations">
                <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
                    <TabsTrigger value="donations">Donations ({filteredDonations.length})</TabsTrigger>
                    <TabsTrigger value="applications">Applications ({filteredApplications.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="donations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Donations</CardTitle>
                            <CardDescription>Review manual transaction proofs and manage donation records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Donor</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method / TrxID</TableHead>
                                        <TableHead>Proof</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDonations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No donations found matching filter.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredDonations.map((donation) => (
                                            <TableRow key={donation._id}>
                                                <TableCell>{new Date(donation.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{donation.donorName || donation.buyer?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground">{donation.buyer?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono">৳{donation.amount}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="capitalize font-medium">{donation.paymentMethod}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{donation.transactionId || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {donation.proofOfPayment ? (
                                                        <a href={donation.proofOfPayment} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                                            <Eye className="h-3 w-3" /> View
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">No Proof</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={donation.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {donation.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction('donation', donation._id, 'approve')}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction('donation', donation._id, 'reject')}>
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

                <TabsContent value="applications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fund Applications</CardTitle>
                            <CardDescription>Review and manage funding requests.</CardDescription>
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
                                    {filteredApplications.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No applications found matching filter.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredApplications.map((app) => (
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
                                                                    Requested by {app.applicant?.name} • ৳{app.amountRequested} • {new Date(app.createdAt).toDateString()}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="border rounded-md p-4 min-h-[200px]">
                                                                <div className="prose dark:prose-invert max-w-none pointer-events-none">
                                                                    {/* Read-only view of Novel content */}
                                                                    <NovelEditor initialValue={app.description} onChange={() => { }} />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-3 mt-4">
                                                                {app.status === 'pending' && (
                                                                    <>
                                                                        <Button variant="destructive" onClick={() => handleAction('application', app._id, 'reject')}>Reject Application</Button>
                                                                        <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('application', app._id, 'approve')}>Approve Application</Button>
                                                                    </>
                                                                )}
                                                                {app.status === 'approved' && (
                                                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('application', app._id, 'disburse')}>
                                                                        <DollarSign className="mr-2 h-4 w-4" /> Disburse Funds
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
        case 'disbursed':
            variant = "default";
            className = "bg-green-500 hover:bg-green-600";
            break;
        case 'approved':
            variant = "default";
            className = "bg-blue-500 hover:bg-blue-600";
            break;
        case 'pending':
            variant = "secondary";
            className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
            break;
        case 'failed':
        case 'rejected':
            variant = "destructive";
            break;
    }

    return (
        <Badge variant={variant} className={className + " capitalize"}>
            {status}
        </Badge>
    );
}
