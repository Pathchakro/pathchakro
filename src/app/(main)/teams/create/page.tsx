'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTeamPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/teams');
    }, [router]);

    return (
        <div className="flex h-[50vh] items-center justify-center">
            <p className="text-muted-foreground">Redirecting...</p>
        </div>
    );
}
