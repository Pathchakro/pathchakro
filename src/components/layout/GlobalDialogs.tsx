'use client';

import { useAppSelector, useAppDispatch } from '@/store';
import { setCreatePostOpen } from '@/store/slices/uiSlice';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { MobileMenu } from '@/components/layout/MobileMenu';

export function GlobalDialogs() {
    const dispatch = useAppDispatch();
    const isCreatePostOpen = useAppSelector((state) => state.ui.isCreatePostOpen);

    return (
        <>
            <CreatePostDialog
                open={isCreatePostOpen}
                onOpenChange={(open) => dispatch(setCreatePostOpen(open))}
            />
            <MobileMenu />
        </>
    );
}
