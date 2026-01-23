'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Banknote,
    Users,
    GraduationCap,
    Plane,
    BookOpen,
    Library,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

const ADMIN_LINKS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Banknote, label: 'Manage Fund', href: '/admin/fund' },
    { icon: Users, label: 'Manage User', href: '/admin/users' },
    { icon: GraduationCap, label: 'Manage Course', href: '/admin/courses' },
    { icon: Plane, label: 'Manage Tours', href: '/admin/tours' },
    { icon: BookOpen, label: 'Manage Book', href: '/admin/books' },
    { icon: Library, label: 'Manage Library', href: '/admin/library' },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen bg-card border-r fixed left-0 top-0 flex flex-col">
            <div className="p-6 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-bold text-xl text-primary">Pathchakro Admin</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {ADMIN_LINKS.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => signOut()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
