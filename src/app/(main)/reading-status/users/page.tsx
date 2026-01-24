'use client';

import { useState, useEffect } from 'react';
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
import { Users, Search, BookOpen, UserX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ActiveBook {
    _id: string;
    title: string;
    coverImage?: string;
    author: string;
    slug?: string;
}

interface UserStat {
    user: {
        _id: string;
        name: string;
        image?: string;
        email: string;
    };
    activeBooks: ActiveBook[];
    readingCount: number;
    isIdle: boolean;
}

export default function UserReadingStatusPage() {
    const [users, setUsers] = useState<UserStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, idle

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/reading-status/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredUsers = () => {
        let filtered = users;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.user.name.toLowerCase().includes(q) ||
                u.user.email.toLowerCase().includes(q)
            );
        }

        if (filter === 'active') {
            filtered = filtered.filter(u => !u.isIdle);
        } else if (filter === 'idle') {
            filtered = filtered.filter(u => u.isIdle);
        }

        return filtered;
    };

    const filteredUsers = getFilteredUsers();

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="mb-6">
                <Link href="/reading-status">
                    <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Global Stats
                    </Button>
                </Link>

                <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                    <Users className="h-8 w-8 text-blue-500" />
                    Reader Details
                </h1>
                <p className="text-muted-foreground">
                    See who is reading what right now
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-4">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-lg">User List ({filteredUsers.length})</CardTitle>
                        <div className="flex gap-2">
                            <Badge
                                variant={filter === 'all' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Badge>
                            <Badge
                                variant={filter === 'active' ? 'default' : 'outline'}
                                className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                                onClick={() => setFilter('active')}
                            >
                                Active
                            </Badge>
                            <Badge
                                variant={filter === 'idle' ? 'default' : 'outline'}
                                className="cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                                onClick={() => setFilter('idle')}
                            >
                                Idle
                            </Badge>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading users...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">User</TableHead>
                                    <TableHead>Currently Reading</TableHead>
                                    <TableHead className="text-right w-[100px]">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                                            No users found based on your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((stat) => (
                                        <TableRow key={stat.user._id}>
                                            <TableCell className="align-top py-4">
                                                <Link href={`/profile/${stat.user._id}`}>
                                                    <div className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-lg transition-colors">
                                                        <Avatar>
                                                            <AvatarImage src={stat.user.image} />
                                                            <AvatarFallback>{stat.user.name[0]?.toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium group-hover:text-primary transition-colors">{stat.user.name}</div>
                                                            <div className="text-xs text-muted-foreground line-clamp-1">{stat.user.email}</div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                {stat.isIdle ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground italic text-sm py-2">
                                                        <UserX className="h-4 w-4" />
                                                        Not reading anything currently
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-4">
                                                        {stat.activeBooks.map((book) => (
                                                            <Link href={`/books/${book.slug || book._id}`} key={book._id} className="w-full max-w-sm">
                                                                <div className="flex gap-3 bg-muted/30 p-2 rounded-md border w-full hover:bg-muted transition-colors cursor-pointer group">
                                                                    <div className="h-16 w-10 bg-secondary rounded overflow-hidden flex-shrink-0 group-hover:shadow-sm transition-all">
                                                                        {book.coverImage ? (
                                                                            <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                                                                <BookOpen className="h-4 w-4" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="overflow-hidden flex-1">
                                                                        <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors" title={book.title}>{book.title}</p>
                                                                        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                                                                        <Badge variant="outline" className="mt-1 h-5 text-[10px] bg-blue-50 text-blue-600 border-blue-100">Reading</Badge>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right align-top py-4 font-medium">
                                                {stat.readingCount > 0 ? stat.readingCount : '-'}
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
