'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddInstituteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (institute: any) => void;
    initialName?: string;
}

export function AddInstituteDialog({ open, onOpenChange, onSuccess, initialName = '' }: AddInstituteDialogProps) {
    const [name, setName] = useState(initialName);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/institutes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Institute added successfully');
            onSuccess(data.institute);
            onOpenChange(false);
            setName('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to add institute');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Institute</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="instituteName">Institute Name</Label>
                        <Input
                            id="instituteName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter institute name"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add Institute'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
