'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Search, BookOpen, PlusCircle, User, Settings, LogOut } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/feed" className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold hidden sm:block">Pathchakro</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl mx-4">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search books, users, teams..."
                                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </form>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {session && <NotificationDropdown />}
                        <Button variant="ghost" size="icon">
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="default" size="sm" className="hidden md:flex gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Create Post
                        </Button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex items-center justify-center text-white font-medium"
                            >
                                {session?.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{session?.user?.name?.[0] || 'U'}</span>
                                )}
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg py-2">
                                    <Link href="/profile/me" className="flex items-center gap-2 px-4 py-2 hover:bg-muted">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm">My Profile</span>
                                    </Link>
                                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-muted">
                                        <Settings className="h-4 w-4" />
                                        <span className="text-sm">Settings</span>
                                    </Link>
                                    <hr className="my-2" />
                                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-muted w-full text-left text-red-500">
                                        <LogOut className="h-4 w-4" />
                                        <span className="text-sm">Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
