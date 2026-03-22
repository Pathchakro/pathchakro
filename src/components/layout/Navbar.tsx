'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Search, BookOpen, PlusCircle, User, Settings, LogOut, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Chatbot } from '@/components/chatbot/Chatbot';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearchQuery as setGlobalSearchQuery } from '@/store/slices/uiSlice';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const dispatch = useAppDispatch();
    const globalSearchQuery = useAppSelector((state) => state.ui.searchQuery);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Login success toast
    useEffect(() => {
        if (searchParams?.get('login') === 'success') {
            toast.success("Welcome back! Login successful.");
            // Clean up URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('login');
            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = useCallback((value: string, shouldRedirect = false) => {
        setLocalSearchQuery(value);
        dispatch(setGlobalSearchQuery(value));
        
        // If not on home page and explicitly typing, redirect to home
        if (shouldRedirect && value.trim() && pathname !== '/') {
            router.replace('/');
        }
    }, [dispatch, pathname, router]);

    // Handle ?q= parameter on initial load
    useEffect(() => {
        const query = searchParams?.get('q');
        if (query && query !== globalSearchQuery) {
            handleSearchChange(query, false); // Don't redirect on initial load from URL
        }
    }, [searchParams, globalSearchQuery, handleSearchChange]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // Global state is already updated via handleSearchChange
    };

    // Sync local with global (for voice etc)
    useEffect(() => {
        setLocalSearchQuery(globalSearchQuery);
    }, [globalSearchQuery]);

    const handleVoiceResult = useCallback((transcript: string) => {
        handleSearchChange(transcript);
    }, [handleSearchChange]);

    const { isListening, toggleListening, supported } = useVoiceSearch({
        onResult: handleVoiceResult,
    });

    return (
        <nav className="hidden md:block sticky top-0 z-50 w-full border-b bg-card shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
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
                                value={localSearchQuery}
                                onChange={(e) => handleSearchChange(e.target.value, true)}
                                placeholder="Search books, posts, reviews..."
                                className="w-full h-10 pl-10 pr-10 rounded-full bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            {supported && (
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                                        isListening 
                                        ? 'text-red-500 bg-red-100 animate-pulse' 
                                        : 'text-muted-foreground hover:text-primary hover:bg-background'
                                    }`}
                                    title="Voice Search"
                                >
                                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        {session && <NotificationDropdown />}

                        <Chatbot />

                        {/* User Menu */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex items-center justify-center text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                {session?.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                                        <User className="h-5 w-5" />
                                    </div>
                                )}
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg py-2 z-50">
                                    {session ? (
                                        <>
                                            <div className="px-4 py-2 border-b mb-2">
                                                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                                            </div>

                                            {session.user?.role === 'admin' && (
                                                <>
                                                    <div className="px-4 py-1">
                                                        <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Admin Controls</h4>
                                                    </div>
                                                    <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-2 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                                                        <BookOpen className="h-4 w-4" />
                                                        <span className="text-sm">Dashboard</span>
                                                    </Link>
                                                    <Link href="/admin/fund" className="flex items-center gap-2 px-4 py-2 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                                                        <Settings className="h-4 w-4" />
                                                        <span className="text-sm">Fund Management</span>
                                                    </Link>
                                                    <hr className="my-2" />
                                                </>
                                            )}

                                            <Link href="/profile/me" className="flex items-center gap-2 px-4 py-2 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                                                <User className="h-4 w-4" />
                                                <span className="text-sm">My Profile</span>
                                            </Link>
                                            <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                                                <Settings className="h-4 w-4" />
                                                <span className="text-sm">Settings</span>
                                            </Link>
                                            <hr className="my-2" />
                                            <button
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-muted w-full text-left text-red-500"
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    signOut();
                                                }}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span className="text-sm">Logout</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-muted w-full text-left"
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                signIn('google', { callbackUrl: '/?login=success' });
                                            }}
                                        >
                                            <div className="flex h-4 w-4 items-center justify-center">
                                                <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                                </svg>
                                            </div>
                                            <span className="text-sm">Login with Google</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
