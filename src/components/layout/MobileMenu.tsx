'use client';

import Link from 'next/link';
import {
    Star, GraduationCap, ShoppingCart,
    Heart, DollarSign, Plane,
    Users, BarChart2, Pen
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { useAppSelector, useAppDispatch } from '@/store';
import { setMobileMenuOpen } from '@/store/slices/uiSlice';

const QUICK_LINKS = [
    { icon: Pen, label: 'Posts', href: '/posts' },
    { icon: Star, label: 'Book Reviews', href: '/reviews' },
    { icon: BarChart2, label: 'Reading Status', href: '/reading-status' },
    { icon: GraduationCap, label: 'Courses', href: '/courses' },
    { icon: ShoppingCart, label: 'Marketplace', href: '/marketplace' },
    { icon: Heart, label: 'Blood Bank', href: '/blood-bank' },
    { icon: DollarSign, label: 'Fund Account', href: '/fund' },
    { icon: Plane, label: 'Tour Planning', href: '/tours' },
    { icon: Users, label: 'Teams', href: '/teams' },
];

export function MobileMenu() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state) => state.ui.isMobileMenuOpen);

    const onOpenChange = (open: boolean) => {
        dispatch(setMobileMenuOpen(open));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[85%] sm:max-w-md p-0 flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="py-2 px-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-left font-bold text-lg text-primary">Pathchakro Menu</SheetTitle>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-1">
                    {/* Navigation Links (Filtered to remove duplicates in bottom navbar) */}
                    <div className="grid grid-cols-1 gap-0 pt-1">
                        {QUICK_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => onOpenChange(false)}
                                className="flex items-center gap-2.5 px-2.5 py-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all group"
                            >
                                <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary">
                                    <link.icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-[11px]">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-muted/5 mt-auto text-center">
                    <p className="text-[10px] text-muted-foreground">© 2026 Pathchakro</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
