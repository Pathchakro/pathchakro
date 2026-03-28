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
import Image from 'next/image';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import LoadingSpinner from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/Pagination';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface BookStat {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
    copies: number; // Availability
    reading: number;
    wantToRead: number;
    completed: number;
    rangeCompleted: number;
    slug?: string;
    reviewCount: number;
    vocalReaders: any[];
    silentReaders: any[];
    allReviewers: any[];
}

const UserListModal = ({ isOpen, onClose, title, users, bookTitle }: { isOpen: boolean, onClose: () => void, title: string, users: any[], bookTitle: string }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5 text-primary" />
                        {title} — {bookTitle} ({users.length})
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4">
                    {users.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No users found in this category.</div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <Link href={`/profile/${user.username || user._id}`} key={user._id} onClick={onClose} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors group">
                                    <Avatar className="h-10 w-10 border group-hover:border-primary transition-colors">
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate group-hover:text-primary transition-colors">{user.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">@{user.username || 'user'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Date Range State (Default: Current Month)
    const [dateRange, setDateRange] = useState({
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        bookTitle: string;
        users: any[];
    }>({
        isOpen: false,
        title: '',
        bookTitle: '',
        users: []
    });

    useEffect(() => {
        setStatusFilter(initialStatus);
    }, [initialStatus]);

    useEffect(() => {
        if (new Date(dateRange.from) > new Date(dateRange.to)) {
            setError('Invalid date range: Start date cannot be after end date.');
            return;
        }
        setError(null);
        fetchStats();
    }, [dateRange]); // Refetch when date changes

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to
            });
            const res = await fetch(`/api/reading-status?${query.toString()}`);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Failed to fetch stats: ${res.status}`);
            }

            const data = await res.json();
            if (data.report) {
                setStats(data.report);
            }
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Failed to load reading status.');
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
    // Paginate results
    const totalPages = Math.ceil(filteredStats.length / pageSize);
    const paginatedStats = filteredStats.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                        <BarChart3 className="h-8 w-8 text-indigo-500" />
                        Reading Status
                    </h1>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-2 bg-card p-2 rounded-lg border shadow-sm self-start md:self-auto">
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

                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-2 rounded-md border border-destructive/20 mb-4 md:mb-0">
                        {error}
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                        <div className="flex justify-center py-20">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[300px]">Book Name</TableHead>
                                            <TableHead className="text-center">Availability</TableHead>
                                            <TableHead className="text-center">Currently Reading</TableHead>
                                            <TableHead className="text-center">Completed</TableHead>
                                            <TableHead className="text-center">Reviews Written</TableHead>
                                            <TableHead className="text-center">Completed (No Review)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedStats.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    {searchQuery || statusFilter ? 'No books match filters' : 'No data available'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedStats.map((book) => (
                                                <TableRow key={book._id}>
                                                    <TableCell>
                                                        <Link href={`/books/${book.slug || book._id}`} className="block hover:bg-muted/50 rounded-md transition-colors -m-2 p-2 group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-12 w-8 overflow-hidden rounded bg-secondary flex-shrink-0 relative">
                                                                    {book.coverImage ? (
                                                                        <Image
                                                                            src={book.coverImage}
                                                                            alt={book.title}
                                                                            fill
                                                                            className="object-cover"
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
                                                        <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                                                            <CheckCircle className="h-4 w-4" />
                                                            {book.completed}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge 
                                                            variant="outline" 
                                                            className="cursor-pointer hover:bg-indigo-50 transition-colors px-2 py-0.5 border-indigo-100 text-indigo-700"
                                                            onClick={() => setModalConfig({
                                                                isOpen: true,
                                                                title: 'All Reviews',
                                                                bookTitle: book.title,
                                                                users: book.allReviewers || []
                                                            })}
                                                        >
                                                            {book.reviewCount} Reviews
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`cursor-pointer hover:bg-orange-50 transition-colors px-2 py-0.5 border-orange-100 text-orange-700 ${(!book.silentReaders || book.silentReaders.length === 0) ? 'opacity-30' : ''}`}
                                                            onClick={() => setModalConfig({
                                                                isOpen: true,
                                                                title: 'Completed - No Review',
                                                                bookTitle: book.title,
                                                                users: book.silentReaders || []
                                                            })}
                                                        >
                                                            {book.silentReaders?.length || 0} People
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {totalPages > 1 && (
                                <Pagination 
                                    currentPage={currentPage} 
                                    totalPages={totalPages} 
                                    onPageChange={setCurrentPage} 
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            <UserListModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                users={modalConfig.users}
                bookTitle={modalConfig.bookTitle}
            />
        </div>
    );
}

export default function ReadingStatusPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ReadingStatusContent />
        </Suspense>
    );
}
