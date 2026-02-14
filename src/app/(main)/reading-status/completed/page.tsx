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
import { Button } from '@/components/ui/button';
import { Trophy, Calendar as CalendarIcon, ArrowRight, ArrowLeft, BookOpen, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface CompletedBook {
    _id: string;
    title: string;
    coverImage?: string;
    author: string;
    completedDate: string;
    slug?: string;
}

interface UserStat {
    user: {
        _id: string;
        name: string;
        image?: string;
        email: string;
    };
    books: CompletedBook[];
    count: number;
}

function CompletedLeaderboardContent() {
    const router = useRouter();

    const [leaderboard, setLeaderboard] = useState<UserStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Date Range State (Default: Current Month)
    const [dateRange, setDateRange] = useState({
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        fetchLeaderboard();
    }, [dateRange]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                from: dateRange.from,
                to: dateRange.to
            });
            const res = await fetch(`/api/reading-status/completed?${query.toString()}`);

            if (!res.ok) {
                console.error(`Failed to fetch: ${res.status}`);
                throw new Error(`Failed to fetch leaderboard: ${res.status}`);
            }

            const data = await res.json();
            if (data.leaderboard) {
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredLeaderboard = () => {
        if (!searchQuery) return leaderboard;
        const q = searchQuery.toLowerCase();
        return leaderboard.filter(item =>
            item.user.name.toLowerCase().includes(q) ||
            item.books.some(b => b.title.toLowerCase().includes(q))
        );
    };

    const filteredLeaderboard = getFilteredLeaderboard();

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/reading-status" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Overview
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Top Readers (Completed)
                    </h1>
                    <p className="text-muted-foreground">
                        Users who have finished books within the selected range
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
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
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg">Leaderboard</CardTitle>
                    <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search user or book..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading champions...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-center">Books Completed</TableHead>
                                    <TableHead>Books Read</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeaderboard.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            No completed books found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeaderboard.map((stat, index) => (
                                        <TableRow key={stat.user._id}>
                                            <TableCell className="text-center font-bold text-lg text-muted-foreground">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/profile/${stat.user._id}`}>
                                                    <div className="flex items-center gap-3 group cursor-pointer">
                                                        <Avatar className="group-hover:ring-2 ring-primary ring-offset-2 transition-all">
                                                            <AvatarImage src={stat.user.image} />
                                                            <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium group-hover:text-primary transition-colors">{stat.user.name}</div>
                                                            {index === 0 && <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-100">🏆 Top Reader</Badge>}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="text-lg px-3 py-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                    {stat.count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    {stat.books.map((book) => (
                                                        <Link href={`/books/${book.slug || book._id}`} key={book._id}>
                                                            <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-md border max-w-[200px] hover:bg-secondary transition-colors cursor-pointer" title={book.title}>
                                                                <div className="h-8 w-6 overflow-hidden rounded bg-gray-200 flex-shrink-0 relative">
                                                                    {book.coverImage ? (
                                                                        <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-medium truncate">{book.title}</span>
                                                            </div>
                                                        </Link>
                                                    ))}
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

export default function CompletedLeaderboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CompletedLeaderboardContent />
        </Suspense>
    );
}
