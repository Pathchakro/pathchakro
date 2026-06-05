import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="max-w-2xl mx-auto pb-8 p-4 min-h-screen space-y-6">
            {/* Top Post Creator Box Skeleton */}
            <div className="bg-card rounded-lg border p-4 shadow-sm space-y-4">
                <div className="flex gap-3 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 flex-1 rounded-full" />
                </div>
                <div className="flex items-center justify-around pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>
                </div>
            </div>

            {/* List of Skeleton Cards */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
                        {/* Card Header */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-28 rounded" />
                                <Skeleton className="h-3 w-20 rounded" />
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-3/4 rounded" />
                            <Skeleton className="h-4 w-full rounded" />
                            <Skeleton className="h-4 w-5/6 rounded" />
                        </div>

                        {/* Card Cover/Image Placeholder (optional structure for book/event/post) */}
                        {i === 2 && (
                            <Skeleton className="h-48 w-full rounded-md" />
                        )}

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                            <div className="flex gap-4">
                                <Skeleton className="h-8 w-12 rounded" />
                                <Skeleton className="h-8 w-12 rounded" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
