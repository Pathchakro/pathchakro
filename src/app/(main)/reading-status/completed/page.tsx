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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Calendar as CalendarIcon, ArrowRight, ArrowLeft, BookOpen, Search, CheckCircle, UserX, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format, startOfMonth, endOfMonth, isToday, isYesterday, differenceInDays } from 'date-fns';
import LoadingSpinner from '@/components/ui/Loading';

interface CompletedBook {
    _id: string;
    title: string;
    coverImage?: string;
    author: string;
    completedDate: string;
    slug?: string;
    hasReviewed?: boolean;
}

interface UserStat {
    user: {
        _id: string;
        name: string;
        image?: string;
        email: string;
        username?: string;
    };
    books: CompletedBook[];
    count: number;
    latestCompletionDate: string | null;
}

interface IdleUser {
    _id: string;
    name: string;
    image?: string;
    email: string;
    username?: string;
    totalCompleted: number;
    totalReading: number;
    libraryCount: number;
    lastCompletedDate: string | null;
    completedBooks: CompletedBook[];
    readingBooks: CompletedBook[];
    libraryBooks: CompletedBook[];
}

const BookListModal = ({ isOpen, onClose, title, books, userName }: { isOpen: boolean, onClose: () => void, title: string, books: any[], userName: string }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {title} — {userName} ({(books || []).length})
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4">
                    {(books || []).length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No books found in this category.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {books.map((book) => (
                                <Link href={`/books/${book.slug || book._id}`} key={book._id} onClick={onClose} className="group">
                                    <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="h-12 w-9 relative flex-shrink-0 overflow-hidden rounded shadow-sm">
                                            {book.coverImage ? (
                                                <Image src={book.coverImage} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="h-full w-full bg-muted flex items-center justify-center text-[10px]">📖</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{book.title}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
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

const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return '1 day ago';
    const days = differenceInDays(new Date(), date);
    if (days < 7) return `${days} days ago`;
    return format(date, 'MMM d, yyyy');
};

function CompletedLeaderboardContent() {
    const router = useRouter();

    const [leaderboard, setLeaderboard] = useState<UserStat[]>([]);
    const [idleUsers, setIdleUsers] = useState<IdleUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        userName: string;
        books: any[];
    }>({
        isOpen: false,
        title: '',
        userName: '',
        books: []
    });

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
            if (data.idleUsers) {
                setIdleUsers(data.idleUsers);
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
                        <div className="flex justify-center py-20">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <Tabs defaultValue="active" className="w-full">
                            <TabsList className="grid w-[300px] grid-cols-2 mb-6">
                                <TabsTrigger value="active" className="gap-2">
                                    <Trophy className="h-4 w-4" />
                                    Leaderboard
                                </TabsTrigger>
                                <TabsTrigger value="idle" className="gap-2">
                                    <UserX className="h-4 w-4" />
                                    No Reading
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="active">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px] text-center">Rank</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-center">Books Completed</TableHead>
                                            <TableHead>Books Finished</TableHead>
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
                                                        <Link href={`/profile/${stat.user.username || stat.user._id}`}>
                                                            <div className="flex items-center gap-3 group cursor-pointer">
                                                                <Avatar className="group-hover:ring-2 ring-primary ring-offset-2 transition-all">
                                                                    <AvatarImage src={stat.user.image} />
                                                                    <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium group-hover:text-primary transition-colors">{stat.user.name}</div>
                                                                    <div className="flex flex-col gap-1 mt-0.5">
                                                                        {stat.latestCompletionDate && (
                                                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                                <Clock className="h-2.5 w-2.5" />
                                                                                Last activity: {getRelativeDate(stat.latestCompletionDate)}
                                                                            </div>
                                                                        )}
                                                                        {index === 0 && <Badge variant="secondary" className="text-xs w-fit bg-yellow-100 text-yellow-700 hover:bg-yellow-100">🏆 Top Reader</Badge>}
                                                                    </div>
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
                                                                    <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-md border min-w-[150px] max-w-[200px] hover:bg-secondary transition-colors cursor-pointer" title={book.title}>
                                                                        <div className="h-8 w-6 overflow-hidden rounded bg-gray-200 flex-shrink-0 relative">
                                                                            {book.coverImage ? (
                                                                                <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
                                                                            ) : (
                                                                                <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                                            <span className="text-xs font-medium truncate" title={book.title}>{book.title}</span>
                                                                            <span className="text-[10px] text-muted-foreground italic text-nowrap">{getRelativeDate(book.completedDate)}</span>
                                                                        </div>
                                                                        {book.hasReviewed && (
                                                                            <div className="flex-shrink-0 ml-1" title="Review submitted">
                                                                                <CheckCircle className="h-3 w-3 text-green-500 fill-green-50" />
                                                                            </div>
                                                                        )}
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
                            </TabsContent>

                            <TabsContent value="idle">
                                <div className="py-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead className="text-center">Books Finished</TableHead>
                                                <TableHead className="text-center">Currently Reading</TableHead>
                                                <TableHead className="text-center">Total Library</TableHead>
                                                <TableHead className="text-center">Activity Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                             {idleUsers.length === 0 ? (
                                                 <TableRow>
                                                     <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                         No idle users found. Everyone is active!
                                                     </TableCell>
                                                 </TableRow>
                                             ) : (
                                                idleUsers
                                                    .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map((user) => (
                                                    <TableRow key={user._id}>
                                                        <TableCell>
                                                            <Link href={`/profile/${user.username || user._id}`}>
                                                                <div className="flex items-center gap-3 group cursor-pointer">
                                                                    <Avatar className="group-hover:ring-2 ring-primary ring-offset-2 transition-all">
                                                                        <AvatarImage src={user.image} />
                                                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                     <div className="overflow-hidden">
                                                                        <div className="font-medium group-hover:text-primary transition-colors">{user.name}</div>
                                                                        <div className="text-[10px] text-muted-foreground truncate">@{user.username || 'user'}</div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`cursor-pointer hover:bg-green-50 transition-colors px-3 py-1 ${user.totalCompleted > 0 ? 'border-green-200 text-green-700' : 'text-muted-foreground'}`}
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    title: 'Completed Books',
                                                                    userName: user.name,
                                                                    books: user.completedBooks
                                                                })}
                                                            >
                                                                {user.totalCompleted} Books
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`cursor-pointer hover:bg-blue-50 transition-colors px-3 py-1 ${user.totalReading > 0 ? 'border-blue-200 text-blue-700' : 'text-muted-foreground'}`}
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    title: 'Currently Reading',
                                                                    userName: user.name,
                                                                    books: user.readingBooks
                                                                })}
                                                            >
                                                                {user.totalReading} Books
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge 
                                                                variant="outline" 
                                                                className="cursor-pointer hover:bg-primary/5 transition-colors px-3 py-1"
                                                                onClick={() => setModalConfig({
                                                                    isOpen: true,
                                                                    title: 'Library Collection',
                                                                    userName: user.name,
                                                                    books: user.libraryBooks
                                                                })}
                                                            >
                                                                {user.libraryCount} Books
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-xs font-medium text-amber-600">Inactive</span>
                                                                <span className="text-[10px] text-muted-foreground italic">
                                                                    {user.lastCompletedDate ? `Last: ${getRelativeDate(user.lastCompletedDate)}` : 'Never finished a book'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            <BookListModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                books={modalConfig.books}
                userName={modalConfig.userName}
            />
        </div>
    );
}

export default function CompletedLeaderboardPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <CompletedLeaderboardContent />
        </Suspense>
    );
}
