'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface User {
    _id: string;
    name: string;
    image?: string;
    rankTier: string;
    university?: string;
    status: string;
    addedAt: string;
}

export default function BookUsersPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const status = searchParams.get('status') || 'all';

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookTitle, setBookTitle] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Book ID from Slug
                const bookRes = await fetch(`/api/books/slug/${slug}`);

                if (!bookRes.ok) {
                    throw new Error(`Failed to fetch book: ${bookRes.status}`);
                }

                const bookData = await bookRes.json();

                if (bookData._id) {
                    setBookTitle(bookData.title);

                    // 2. Fetch Users
                    const usersUrl = `/api/books/${bookData._id}/users?status=${status === 'in-library' ? 'in-library' : status}`;
                    console.log('Fetching users from:', usersUrl);

                    const usersRes = await fetch(usersUrl);

                    if (!usersRes.ok) {
                        const text = await usersRes.text();
                        console.error('Fetch failed:', usersRes.status, text);
                        throw new Error(`Failed to fetch users: ${usersRes.status}`);
                    }

                    const usersData = await usersRes.json();

                    if (usersData.users) {
                        setUsers(usersData.users);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchData();
    }, [slug, status]);

    const getStatusLabel = (s: string) => {
        switch (s) {
            case 'reading': return 'Reading';
            case 'completed': return 'Completed';
            case 'want-to-read': return 'Want to Read';
            case 'in-library': return 'Have this book';
            default: return 'Readers';
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href={`/books/${slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Book
            </Link>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    People who {status === 'completed' ? 'finished' : (status === 'reading' ? 'are reading' : 'have')}
                </h1>
                <p className="text-muted-foreground text-lg">"{bookTitle}"</p>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border">
                    <p className="text-muted-foreground">No users found with this status.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {users.map((user) => (
                        <div key={user._id} className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                            {user.image ? (
                                <div className="h-12 w-12 rounded-full overflow-hidden relative">
                                    <Image src={user.image} alt={user.name} fill className="object-cover" />
                                </div>
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
                                    {user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}

                            <div className="flex-1">
                                <h3 className="font-semibold">{user.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
                                        {user.rankTier}
                                    </span>
                                    {user.university && <span>• {user.university}</span>}
                                </div>
                            </div>

                            <Link href={`/profile/${user._id}`}>
                                <Button variant="outline" size="sm">
                                    View Profile
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
