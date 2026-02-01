'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProfileCompletionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileCompletionModal({ open, onOpenChange }: ProfileCompletionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        You need to have a 70% complete profile to perform this action.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-center text-muted-foreground">
                        Please update your profile information including bio, address, and academic details.
                    </p>
                </div>
                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button asChild className="w-full">
                        <Link href="/profile/edit">Go to Profile Settings</Link>
                    </Button>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
