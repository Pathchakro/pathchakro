'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Activity, Book, BarChart3, Users, Heart, CheckCircle, Search, BookOpen, UserCheck, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface BookStat {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
    copies: number; // Availability
    reading: number;
    wantToRead: number;
    completed: number;
    rangeCompleted: number; // New field from API
    slug?: string; // Add slug
}

interface Summary {
    totalReaders: number;
    activeBooks: number;
    rangeCompleted: number; // Renamed from monthlyCompleted
}

function ReadingStatusContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initial filter from URL or empty
    const initialStatus = searchParams.get('status') || '';

    const [stats, setStats] = useState<BookStat[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalReaders: 0, activeBooks: 0, rangeCompleted: 0 });
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    // Date Range State (Default: Current Month)
    const [dateRange, setDateRange] = useState({
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        setStatusFilter(initialStatus);
    }, [initialStatus]);

    useEffect(() => {
        fetchStats();
    }, [dateRange]); // Refetch when date changes

    const fetchStats = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to
            });
            const res = await fetch(`/api/reading-status?${query.toString()}`);
            const data = await res.json();
            if (data.report) {
                setStats(data.report);
            }
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredStats = () => {
        let filtered = stats;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(book =>
                book.title.toLowerCase().includes(q) ||
                book.author.toLowerCase().includes(q)
            );
        }

        if (statusFilter) {
            if (statusFilter === 'reading') {
                filtered = filtered.filter(book => book.reading > 0);
            } else if (statusFilter === 'want-to-read') {
                filtered = filtered.filter(book => book.wantToRead > 0);
            } else if (statusFilter === 'completed') {
                filtered = filtered.filter(book => book.completed > 0);
            }
        }

        return filtered;
    };

    const filteredStats = getFilteredStats();

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                        <BarChart3 className="h-8 w-8 text-indigo-500" />
                        Reading Global Status
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time statistics on what the community is reading
                    </p>
                </div>

                {/* Date Range Filter - Reverted to Top Right */}
                <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm self-start md:self-auto">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium hidden sm:inline-block">Range:</span>
                    </div>
                    <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-auto h-8 text-sm"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-auto h-8 text-sm"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* 1. Total Users -> Go to User Details Page (Clickable) */}
                <Link href="/reading-status/users" className="block transition-transform hover:scale-[1.02]">
                    <Card className="h-full cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-600">Total Users Reading</p>
                                    <h3 className="text-2xl font-bold">{summary.totalReaders}</h3>
                                    <p className="text-xs text-blue-500 mt-1">View Details &rarr;</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* 2. Active Books -> Static (Display Only) */}
                <Card className="h-full">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Books Being Read</p>
                                <h3 className="text-2xl font-bold">{summary.activeBooks}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Completed -> Clickable Leaderboard */}
                <Link href="/reading-status/completed" className="block transition-transform hover:scale-[1.02]">
                    <Card className="h-full cursor-pointer hover:border-green-300 hover:shadow-md transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                    <CalendarIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-green-600">Completed (Selected Range)</p>
                                    <h3 className="text-2xl font-bold">{summary.rangeCompleted}</h3>
                                    <p className="text-xs text-green-500 mt-1">View Leaderboard &rarr;</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-4">
                    <CardTitle className="text-lg">Book Statistics</CardTitle>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search books..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="reading">Currently Reading</option>
                            <option value="want-to-read">In Wishlists</option>
                            <option value="completed">Completed</option>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading stats...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Book Name</TableHead>
                                    <TableHead className="text-center">Availability</TableHead>
                                    <TableHead className="text-center">Currently Reading</TableHead>
                                    <TableHead className="text-center">Wish to Read</TableHead>
                                    <TableHead className="text-center">Completed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStats.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            {searchQuery || statusFilter ? 'No books match filters' : 'No data available'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStats.map((book) => (
                                        <TableRow key={book._id}>
                                            <TableCell>
                                                <Link href={`/books/${book.slug || book._id}`} className="block hover:bg-muted/50 rounded-md transition-colors -m-2 p-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-8 overflow-hidden rounded bg-secondary flex-shrink-0">
                                                            {book.coverImage ? (
                                                                <img
                                                                    src={book.coverImage}
                                                                    alt={book.title}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                                                                    <Book className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{book.title}</div>
                                                            <div className="text-xs text-muted-foreground">{book.author}</div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={book.copies > 0 ? "default" : "secondary"}>
                                                    {book.copies} available
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-blue-600 font-medium">
                                                    <Users className="h-4 w-4" />
                                                    {book.reading}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-red-500 font-medium">
                                                    <Heart className="h-4 w-4" />
                                                    {book.wantToRead}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                                                    <CheckCircle className="h-4 w-4" />
                                                    {book.completed}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReadingStatusPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReadingStatusContent />
        </Suspense>
    );
}
