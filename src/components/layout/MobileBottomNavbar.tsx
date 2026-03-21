'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Plus, PenTool, Menu, Calendar, Library } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { setCreatePostOpen, toggleMobileMenu } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';

export function MobileBottomNavbar() {
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t px-1 h-10 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
            {/* 7 Icons Layout */}
            <Link 
                href="/" 
                className={cn(
                    "flex flex-1 items-center justify-center h-full transition-colors", 
                    pathname === '/' ? "text-primary" : "text-muted-foreground"
                )}
                aria-label="Home"
            >
                <Home className="h-[18px] w-[18px]" />
            </Link>
            
            <Link 
                href="/library" 
                className={cn(
                    "flex flex-1 items-center justify-center h-full transition-colors", 
                    pathname === '/library' ? "text-primary" : "text-muted-foreground"
                )}
                aria-label="Library"
            >
                <Library className="h-[18px] w-[18px]" />
            </Link>

            <Link 
                href="/books" 
                className={cn(
                    "flex flex-1 items-center justify-center h-full transition-colors", 
                    pathname === '/books' ? "text-primary" : "text-muted-foreground"
                )}
                aria-label="Books"
            >
                <BookOpen className="h-[18px] w-[18px]" />
            </Link>

            {/* Center Plus Icon for Post Popup */}
            <div className="flex flex-1 items-center justify-center">
                <button 
                    onClick={() => dispatch(setCreatePostOpen(true))}
                    className="bg-primary text-primary-foreground h-7 w-7 rounded-sm flex items-center justify-center shadow-md active:scale-95 transition-all"
                    aria-label="Create Post"
                >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
            </div>

            <Link 
                href="/events" 
                className={cn(
                    "flex flex-1 items-center justify-center h-full transition-colors", 
                    pathname === '/events' ? "text-primary" : "text-muted-foreground"
                )}
                aria-label="Events"
            >
                <Calendar className="h-[18px] w-[18px]" />
            </Link>

            <Link 
                href="/writing" 
                className={cn(
                    "flex flex-1 items-center justify-center h-full transition-colors", 
                    pathname === '/writing' ? "text-primary" : "text-muted-foreground"
                )}
                aria-label="Writing"
            >
                <PenTool className="h-[18px] w-[18px]" />
            </Link>
            
            <button 
                onClick={() => dispatch(toggleMobileMenu())}
                className="flex flex-1 items-center justify-center h-full text-muted-foreground hover:text-primary transition-colors"
                aria-label="Menu"
            >
                <Menu className="h-[18px] w-[18px]" />
            </button>
        </div>
    );
}
