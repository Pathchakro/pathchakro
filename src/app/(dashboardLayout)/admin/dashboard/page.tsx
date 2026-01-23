'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DollarSign, TrendingUp, Users, ShoppingCart,
    Book, PenTool, Calendar, Activity, Download, FileText
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface Analytics {
    period: string;
    platformStats: {
        totalUsers: number;
        totalProducts: number;
        totalBooks: number;
        totalWritingProjects: number;
        totalPosts: number;
        totalTeams: number;
    };
    financials: {
        totalRevenue: number;
        totalPlatformFee: number;
        totalSellerEarnings: number;
        totalTransactions: number;
        averageTransactionValue: number;
    };
    salesByCategory: Array<{
        _id: string;
        revenue: number;
        count: number;
    }>;
    revenueByType: Array<{
        _id: string;
        revenue: number;
        platformFee: number;
        count: number;
    }>;
    recentTransactions: Array<{
        _id: string;
        itemName: string;
        amount: number;
        platformFee: number;
        buyer?: { name: string };
        seller?: { name: string };
        createdAt: string;
    }>;
    dailyRevenue: Array<{
        _id: string;
        revenue: number;
        platformFee: number;
        transactions: number;
    }>;
}

interface ProfitAnalysis {
    summary: {
        totalRevenue: number;
        totalPlatformProfit: number;
        totalSellerPayout: number;
        transactionCount: number;
    };
    trend: Array<{
        date: string;
        profit: number;
        revenue: number;
        payouts: number;
    }>;
}

export default function AdminDashboardPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    // Custom Date Range
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    useEffect(() => {
        fetchProfitAnalysis();
    }, [startDate, endDate]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/analytics?period=${period}`);
            const data = await response.json();
            if (data.financials) {
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfitAnalysis = async () => {
        try {
            const response = await fetch(`/api/admin/analytics/profit?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            if (data.summary) {
                setProfitAnalysis(data);
            }
        } catch (error) {
            console.error('Error fetching profit analysis:', error);
        }
    };

    const handleDownloadReport = () => {
        // Trigger file download
        window.open(`/api/admin/transactions/export?startDate=${startDate}&endDate=${endDate}`, '_blank');
    };

    const formatCurrency = (amount: number) => {
        return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">Loading analytics...</div>
            </div>
        );
    }

    if (!analytics) return null;

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Platform analytics and financial overview</p>
                </div>

                <div className="flex gap-2">
                    <Button variant={period === '7' ? 'default' : 'outline'} onClick={() => setPeriod('7')} size="sm">
                        7 Days
                    </Button>
                    <Button variant={period === '30' ? 'default' : 'outline'} onClick={() => setPeriod('30')} size="sm">
                        30 Days
                    </Button>
                    <Button variant={period === '90' ? 'default' : 'outline'} onClick={() => setPeriod('90')} size="sm">
                        90 Days
                    </Button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.financials.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">{analytics.period}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(analytics.financials.totalPlatformFee)}
                        </div>
                        <p className="text-xs text-muted-foreground">Platform earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Seller Payouts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {formatCurrency(analytics.financials.totalSellerEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground">Expense (Paid to sellers)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.financials.totalTransactions}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg: {formatCurrency(analytics.financials.averageTransactionValue)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="profit_analysis">Profit Analysis & Export</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                {/* Overview Content */}
                <TabsContent value="overview">
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Platform Statistics</CardTitle>
                            <CardDescription>Total counts across the platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[
                                    { label: 'Users', value: analytics.platformStats.totalUsers, icon: Users, color: 'text-blue-500' },
                                    { label: 'Products', value: analytics.platformStats.totalProducts, icon: ShoppingCart, color: 'text-green-500' },
                                    { label: 'Books', value: analytics.platformStats.totalBooks, icon: Book, color: 'text-purple-500' },
                                    { label: 'Writings', value: analytics.platformStats.totalWritingProjects, icon: PenTool, color: 'text-pink-500' },
                                    { label: 'Posts', value: analytics.platformStats.totalPosts, icon: Activity, color: 'text-orange-500' },
                                    { label: 'Teams', value: analytics.platformStats.totalTeams, icon: Users, color: 'text-cyan-500' },
                                ].map((stat, i) => (
                                    <div key={i} className="text-center p-4 bg-muted rounded-lg">
                                        <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {analytics.salesByCategory.map((item) => (
                                    <div key={item._id} className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span className="capitalize">{item._id}</span>
                                        <span className="font-bold">{formatCurrency(item.revenue)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Daily Revenue Trend</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {analytics.dailyRevenue.slice(-5).map((day) => (
                                    <div key={day._id} className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>{day._id}</span>
                                        <span className="font-bold">{formatCurrency(day.revenue)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Profit Analysis & Export Tab */}
                <TabsContent value="profit_analysis">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Controls */}
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Date Range Analysis</CardTitle>
                                <CardDescription>Select range to analyze profit/expense and export data</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                                <Button onClick={handleDownloadReport} className="w-full">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download CSV Report
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Analysis Results */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Profit & Expense Report</CardTitle>
                                <CardDescription>
                                    From {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profitAnalysis ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                                                <p className="text-xl font-bold text-blue-700">
                                                    {formatCurrency(profitAnalysis.summary.totalRevenue)}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-600 font-medium">Net Profit</p>
                                                <p className="text-xl font-bold text-green-700">
                                                    {formatCurrency(profitAnalysis.summary.totalPlatformProfit)}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-red-50 rounded-lg">
                                                <p className="text-sm text-red-600 font-medium">Total Expense (Payouts)</p>
                                                <p className="text-xl font-bold text-red-700">
                                                    {formatCurrency(profitAnalysis.summary.totalSellerPayout)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-3">Daily Breakdown</h4>
                                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                                {profitAnalysis.trend.map((day) => (
                                                    <div key={day.date} className="flex items-center justify-between p-2 border-b text-sm">
                                                        <span className="w-24 font-medium">{day.date}</span>
                                                        <span className="text-green-600 w-24 text-right">+{formatCurrency(day.profit)}</span>
                                                        <span className="text-red-500 w-24 text-right">-{formatCurrency(day.payouts)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">Select date range to view analysis</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.recentTransactions.map((txn) => (
                                    <div key={txn._id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{txn.itemName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {txn.buyer?.name} → {txn.seller?.name || 'Platform'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(txn.amount)}</p>
                                            <p className="text-xs text-green-600">Fee: {formatCurrency(txn.platformFee)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
