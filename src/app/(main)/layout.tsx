import { Navbar } from '@/components/layout/Navbar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { MobileTopNavbar } from '@/components/layout/MobileTopNavbar';
import { MobileBottomNavbar } from '@/components/layout/MobileBottomNavbar';
import { GlobalDialogs } from '@/components/layout/GlobalDialogs';
import { Suspense } from 'react';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<div className="h-16 w-full border-b bg-card" />}>
                <Navbar />
                <MobileTopNavbar />
            </Suspense>
            <div className="max-w-[1920px] mx-auto flex">
                <LeftSidebar />
                <main className="flex-1 min-w-0 pb-10 md:pb-0">
                    {children}
                </main>
                <RightSidebar />
            </div>
            <MobileBottomNavbar />
            <GlobalDialogs />
        </div>
    );
}
