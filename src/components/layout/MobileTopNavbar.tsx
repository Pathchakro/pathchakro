'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, BookOpen, User, Settings, LogOut, LayoutDashboard, DollarSign, Mic, MicOff } from 'lucide-react';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { Chatbot } from '@/components/chatbot/Chatbot';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearchQuery as setGlobalSearchQuery } from '@/store/slices/uiSlice';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileTopNavbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const globalSearchQuery = useAppSelector((state) => state.ui.searchQuery);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const router = useRouter();

    const handleSearchChange = useCallback((value: string, shouldRedirect = false) => {
        setLocalSearchQuery(value);
        dispatch(setGlobalSearchQuery(value));
        
        // If not on home page and typing, redirect to home
        if (shouldRedirect && value.trim() && pathname !== '/') {
            router.push('/');
        }
    }, [pathname, router, dispatch]);

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
        <div className="md:hidden sticky top-0 z-50 w-full bg-card border-b px-2.5 h-10 flex items-center gap-2">
            {/* Left: Logo */}
            <Link href="/" className="shrink-0">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
            </Link>

            {/* Center: Search Bar */}
            <div className="flex-1">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                        type="search"
                        value={localSearchQuery}
                        onChange={(e) => handleSearchChange(e.target.value, true)}
                        placeholder="Search books, posts, reviews..."
                        className="w-full h-6.5 pl-7 pr-7 rounded-full bg-muted border-0 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {supported && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
                                isListening 
                                ? 'text-red-500 bg-red-100 animate-pulse' 
                                : 'text-muted-foreground'
                            }`}
                        >
                            {isListening ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
                        </button>
                    )}
                </form>
            </div>

            {/* Right: AI Chatbot & Profile Dropdown */}
            <div className="flex items-center gap-1 shrink-0">
                <Chatbot />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-6.5 w-6.5 rounded-full overflow-hidden bg-muted flex items-center justify-center relative border focus:outline-none focus:ring-1 focus:ring-primary">
                            {session?.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-1">
                        {session ? (
                            <>
                                <DropdownMenuLabel className="font-normal px-4 py-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-xs font-bold leading-none">{session.user?.name}</p>
                                        <p className="text-[10px] leading-none text-muted-foreground truncate italic">
                                            {session.user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {session.user?.role === 'admin' && (
                                    <>
                                        <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="text-xs group">
                                            <LayoutDashboard className="mr-2 h-3.5 w-3.5 text-red-500" />
                                            <span>Admin Dashboard</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/admin/fund')} className="text-xs">
                                            <DollarSign className="mr-2 h-3.5 w-3.5 text-red-500" />
                                            <span>Fund Management</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => router.push('/profile/me')} className="text-xs">
                                    <User className="mr-2 h-3.5 w-3.5" />
                                    <span>My Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings')} className="text-xs">
                                    <Settings className="mr-2 h-3.5 w-3.5" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => signOut()}
                                    className="text-xs text-red-500 focus:text-red-500"
                                >
                                    <LogOut className="mr-2 h-3.5 w-3.5" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <DropdownMenuItem 
                                onClick={() => signIn('google', { callbackUrl: '/?login=success' })}
                                className="text-xs font-bold"
                            >
                                <User className="mr-2 h-3.5 w-3.5" />
                                <span>Login with Google</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
