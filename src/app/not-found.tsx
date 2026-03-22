'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <div className="flex justify-center mb-8">
                    <Logo />
                </div>
                
                <h1 className="text-9xl font-extrabold text-primary mb-4 opacity-20">404</h1>
                
                <div className="w-full">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Oops! Page not found.</h2>
                    <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <Button asChild variant="default" size="lg" className="rounded-full px-8">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="rounded-full px-8"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Subtle background elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" 
                />
            </div>
        </div>
    );
}
