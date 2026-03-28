'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BookStatusButtonsProps {
    bookId: string;
    initialStatus?: string;
    onStatusChange?: (newStatus: string) => void;
    size?: "default" | "sm" | "icon" | "lg";
    className?: string;
    showLoginModal?: () => void;
}

export function BookStatusButtons({
    bookId,
    initialStatus = '',
    onStatusChange,
    className = '',
    showLoginModal
}: BookStatusButtonsProps) {
    const { data: session } = useSession();
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setStatus(initialStatus);
    }, [initialStatus]);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!session) {
            if (showLoginModal) {
                showLoginModal();
            } else {
                toast.error('Please login to continue');
            }
            return;
        }

        if (loading) return;

        // Optimistic update
        const previousStatus = status;
        setStatus(newStatus);
        setLoading(true);

        try {
            const res = await fetch('/api/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            const data = await res.json();
            
            // Success Toast Logic
            if (newStatus === 'want-to-read') {
                toast.success('Added to Wishlist');
            } else if (newStatus === 'reading') {
                toast.success('Started Reading');
            } else if (newStatus === 'completed') {
                toast.success('Marked as Completed');
            } else if (newStatus === '') {
                if (previousStatus === 'want-to-read') toast.success('Removed from Wishlist');
                else if (previousStatus === 'reading') toast.success('Stopped Reading');
                else if (previousStatus === 'completed') toast.success('Marked as Not Completed');
                else toast.success('Status cleared');
            }

            if (onStatusChange) {
                onStatusChange(newStatus);
            }
        } catch (error) {
            console.error('Status update failed:', error);
            toast.error('Failed to update status');
            setStatus(previousStatus); // Revert on failure
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Button
                variant="ghost"
                size="icon"
                title={status === 'want-to-read' ? "Remove from Wishlist" : "Wish to Read"}
                onClick={() => handleUpdateStatus(status === 'want-to-read' ? '' : 'want-to-read')}
                disabled={loading}
                className={`h-10 w-10 rounded-full transition-colors ${status === 'want-to-read' ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`}
            >
                <Heart className={`h-5 w-5 ${status === 'want-to-read' ? "fill-current" : ""}`} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                title={status === 'reading' ? "Stop Reading" : "Start Reading"}
                onClick={() => handleUpdateStatus(status === 'reading' ? '' : 'reading')}
                disabled={loading}
                className={`h-10 w-10 rounded-full transition-colors ${status === 'reading' ? "text-blue-500 bg-blue-50" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-50"}`}
            >
                <BookOpen className={`h-5 w-5 ${status === 'reading' ? "fill-current" : ""}`} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                title={status === 'completed' ? "Mark as Not Completed" : "Mark as Completed"}
                onClick={() => handleUpdateStatus(status === 'completed' ? '' : 'completed')}
                disabled={loading}
                className={`h-10 w-10 rounded-full transition-colors ${status === 'completed' ? "text-green-500 bg-green-50" : "text-muted-foreground hover:text-green-500 hover:bg-green-50"}`}
            >
                <CheckCircle className={`h-5 w-5 ${status === 'completed' ? "fill-current" : ""}`} />
            </Button>
        </div>
    );
}
