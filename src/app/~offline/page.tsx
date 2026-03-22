import Link from 'next/link';
import { WifiOff, RefreshCcw, Home } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <WifiOff className="h-12 w-12 text-orange-500" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">You&apos;re offline</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        It looks like you&apos;ve lost your internet connection. Some pages you&apos;ve visited before are still available.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-md"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card font-semibold hover:bg-muted transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </Link>
                </div>

                <p className="text-xs text-muted-foreground">
                    Previously visited pages may be available from the cache.
                </p>
            </div>
        </div>
    );
}
