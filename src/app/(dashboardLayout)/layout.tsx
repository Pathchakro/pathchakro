import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <main className="ml-64 min-h-screen">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
