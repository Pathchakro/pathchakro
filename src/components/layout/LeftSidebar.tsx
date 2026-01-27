'use client';

import Link from 'next/link';
import { Home, Library, GraduationCap, ShoppingCart, Heart, DollarSign, Plane, PenTool, Calendar, Users, BarChart2, BookOpen, Pen } from 'lucide-react';
import { useSession } from 'next-auth/react';

const QUICK_LINKS = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Pen, label: 'Posts', href: '/posts' },
    { icon: Library, label: 'Library', href: '/library' },
    { icon: BookOpen, label: 'Books', href: '/books' },
    { icon: BarChart2, label: 'Reading Status', href: '/reading-status' },
    { icon: PenTool, label: 'My Writings', href: '/writing' },
    { icon: Calendar, label: 'Pathchakro Events', href: '/events' },
    { icon: GraduationCap, label: 'Courses', href: '/courses' },
    { icon: ShoppingCart, label: 'Marketplace', href: '/marketplace' },
    { icon: Heart, label: 'Blood Donation', href: '/blood-donation' },
    { icon: DollarSign, label: 'Fund Account', href: '/fund' },
    { icon: Plane, label: 'Tour Planning', href: '/tours' },
    { icon: Users, label: 'My Teams', href: '/teams' },
];



export function LeftSidebar() {
    const { data: session } = useSession();
    return (
        <aside className="hidden lg:block w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">

            {/* Quick Links */}
            <div className="bg-transparent rounded-lg p-4 mb-4 shadow-sm">
                <nav className="space-y-1">
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                        >
                            <link.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>



        </aside>
    );
}
