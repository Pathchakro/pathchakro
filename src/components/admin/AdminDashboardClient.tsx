'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Users, ShoppingCart, Book, PenTool, Activity } from 'lucide-react';

interface Financials {
    totalRevenue: number;
    totalPlatformFee: number;
    totalSellerEarnings: number;
    totalTransactions: number;
    averageTransactionValue: number;
}

interface PlatformStats {
    totalUsers: number;
    totalProducts: number;
    totalBooks: number;
    totalWritingProjects: number;
    totalPosts: number;
    totalTeams: number;
}

interface TransactionData {
    _id?: string;
    id?: string;
    itemName?: string;
    createdAt: string | Date;
    totalPrice?: number;
    amount?: number;
    platformFee?: number;
}

export interface AdminDashboardData {
    financials?: Financials;
    platformStats?: PlatformStats;
    recentTransactions?: TransactionData[];
}

interface StatCardProps {
    title: string;
    value: React.ReactNode | string | number;
    sub?: string;
    icon?: React.ReactNode;
    color?: string;
}

interface SimpleStatProps {
    label: string;
    value: string | number | React.ReactNode;
    icon: React.ReactNode;
}

export default function AdminDashboardClient({ initialData, period }: { initialData: AdminDashboardData, period: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePeriodChange = (newPeriod: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('period', newPeriod);
        router.push(`/admin/dashboard?${params.toString()}`);
    };

    const formatCurrency = (amount?: number | null) => {
        if (amount === null || amount === undefined || !Number.isFinite(amount)) {
            return '৳0';
        }
        return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const financials = initialData?.financials || {
        totalRevenue: 0,
        totalPlatformFee: 0,
        totalSellerEarnings: 0,
        totalTransactions: 0,
        averageTransactionValue: 0
    };

    const stats = initialData?.platformStats || {
        totalUsers: 0,
        totalProducts: 0,
        totalBooks: 0,
        totalWritingProjects: 0,
        totalPosts: 0,
        totalTeams: 0
    };

    const recentTxns = Array.isArray(initialData?.recentTransactions) ? initialData.recentTransactions : [];

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground font-medium mt-1">Platform analytics and financial overview</p>
                </div>
                <div className="flex bg-muted/50 p-1.5 rounded-2xl border-2 shadow-sm">
                    {['7', '30', '90'].map(p => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handlePeriodChange(p)}
                            className={`rounded-xl px-6 font-bold ${period === p ? 'shadow-md' : ''}`}
                        >
                            {p} Days
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(financials.totalRevenue)}
                    sub={`${period} Days`}
                    icon={<DollarSign className="h-5 w-5 text-blue-500" />}
                />
                <StatCard
                    title="Platform Profit"
                    value={formatCurrency(financials.totalPlatformFee)}
                    sub="Fee Collected"
                    icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                    color="text-green-600"
                />
                <StatCard
                    title="Seller Earnings"
                    value={formatCurrency(financials.totalSellerEarnings)}
                    sub="Payouts"
                    icon={<Users className="h-5 w-5 text-red-500" />}
                    color="text-red-500"
                />
                <StatCard
                    title="Transactions"
                    value={financials.totalTransactions || 0}
                    sub={`Avg: ${formatCurrency(financials.averageTransactionValue)}`}
                    icon={<Activity className="h-5 w-5 text-purple-500" />}
                />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl border-2 w-fit">
                    <TabsTrigger value="overview" className="rounded-xl px-8 font-bold data-[state=active]:shadow-md">Platform Stats</TabsTrigger>
                    <TabsTrigger value="transactions" className="rounded-xl px-8 font-bold data-[state=active]:shadow-md">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        <SimpleStat label="Users" value={stats.totalUsers} icon={<Users className="text-blue-500" />} />
                        <SimpleStat label="Products" value={stats.totalProducts} icon={<ShoppingCart className="text-green-500" />} />
                        <SimpleStat label="Books" value={stats.totalBooks} icon={<Book className="text-purple-500" />} />
                        <SimpleStat label="Writings" value={stats.totalWritingProjects} icon={<PenTool className="text-pink-500" />} />
                        <SimpleStat label="Posts" value={stats.totalPosts} icon={<Activity className="text-orange-500" />} />
                        <SimpleStat label="Teams" value={stats.totalTeams} icon={<Users className="text-cyan-500" />} />
                    </div>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/5 border-b-2 pb-6">
                            <CardTitle className="text-xl font-black">Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentTxns.length === 0 ? (
                                <div className="text-center p-12 text-muted-foreground font-bold">No transactions found.</div>
                            ) : (
                                <div className="divide-y-2">
                                    {recentTxns.map((txn: TransactionData, i: number) => {
                                        const txnId = txn._id || txn.id || `txn-fallback-${i}`;
                                        const d = new Date(txn.createdAt);
                                        const dateStr = isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
                                        const price = txn.totalPrice ?? txn.amount ?? 0;
                                        const fee = txn.platformFee ?? 0;

                                        return (
                                            <div key={txnId} className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors group">
                                                <div>
                                                    <p className="font-black text-foreground group-hover:text-primary transition-colors">{txn.itemName || 'Product / Item'}</p>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{dateStr}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-lg">{formatCurrency(price)}</p>
                                                    <p className="text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-50 inline-block px-2 py-0.5 rounded-md mt-1">
                                                        Fee: {formatCurrency(fee)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ title, value, sub, icon, color = "" }: StatCardProps) {
    return (
        <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden hover:border-primary/20 transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/5 border-b border-transparent group-hover:border-primary/5 transition-colors">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
                <div className="p-2 bg-background rounded-xl shadow-sm border">{icon}</div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className={`text-3xl font-black ${color}`}>{value}</div>
                {sub && <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function SimpleStat({ label, value, icon }: SimpleStatProps) {
    return (
        <div className="text-center p-6 bg-card border-2 rounded-[2rem] shadow-sm hover:scale-105 hover:border-primary/20 hover:shadow-lg transition-all cursor-default group">
            <div className="h-12 w-12 mx-auto mb-4 bg-muted/50 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                {icon}
            </div>
            <p className="text-2xl font-black">{value || 0}</p>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1 group-hover:text-primary/70 transition-colors">{label}</p>
        </div>
    );
}
