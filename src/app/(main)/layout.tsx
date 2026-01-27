import { Navbar } from '@/components/layout/Navbar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { Suspense } from 'react';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Suspense fallback={<div className="h-16 w-full border-b bg-card" />}>
                <Navbar />
            </Suspense>
            <div className="max-w-[1920px] mx-auto flex">
                <LeftSidebar />
                <main className="flex-1 min-w-0">
                    {children}
                </main>
                <RightSidebar />
            </div>
        </>
    );
}
