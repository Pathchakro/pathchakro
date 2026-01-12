'use client';

import Link from 'next/link';
import { Home, Library, GraduationCap, ShoppingCart, Heart, DollarSign, Plane, PenTool, Calendar, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

const QUICK_LINKS = [
    { icon: Home, label: 'News Feed', href: '/feed' },
    { icon: Library, label: 'My Library', href: '/library' },
    { icon: PenTool, label: 'My Writings', href: '/writing' },
    { icon: Calendar, label: 'Pathchakro Events', href: '/events' },
    { icon: GraduationCap, label: 'My Courses', href: '/courses' },
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
            {/* User Profile Card */}
            <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
                <div className="flex items-center gap-3">
                    {session?.user?.image ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                            <img
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{session?.user?.name || 'User Name'}</p>
                        <p className="text-xs text-muted-foreground">{session?.user?.role || 'Member'}</p>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                        <p className="font-semibold">{session?.user?.followers?.length || 0}</p>
                        <p className="text-muted-foreground">Followers</p>
                    </div>
                    <div>
                        <p className="font-semibold">{session?.user?.following?.length || 0}</p>
                        <p className="text-muted-foreground">Following</p>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
                <h3 className="font-semibold mb-3 text-sm">Quick Links</h3>
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
