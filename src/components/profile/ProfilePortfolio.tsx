'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PortfolioHero } from './PortfolioHero';
import { PortfolioStats } from './PortfolioStats';
import { PortfolioLibraryStats } from './PortfolioLibraryStats';
import { PortfolioAuthoredBooks } from './PortfolioAuthoredBooks';

interface ProfilePortfolioProps {
    user: any;
    stats: any;
    isOwnProfile?: boolean;
}

export function ProfilePortfolio({ user, stats, isOwnProfile }: ProfilePortfolioProps) {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">
            {/* Background Texture & Atmospheric Glows */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* 40px Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.03]" 
                    style={{ 
                        backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                        backgroundSize: '40px 40px' 
                    }} 
                />
                
                {/* Ambient Spotlights */}
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[150px]" 
                />
                <motion.div 
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[30%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.2, 0.15] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px]" 
                />
            </div>

            {/* Main Content Container */}
            <div className="flex flex-col relative z-10">
                <section id="hero">
                    <PortfolioHero user={user} isOwnProfile={isOwnProfile} />
                </section>
                
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="space-y-0"
                >
                    <section id="about">
                        <PortfolioStats user={user} stats={stats} />
                    </section>

                    <section id="stats">
                        <PortfolioLibraryStats stats={stats} />
                    </section>
                    
                    <section id="works">
                        <PortfolioAuthoredBooks userId={user._id} />
                    </section>
                </motion.div>
                
                {/* Footer Signature */}
                <footer className="py-24 px-6 border-t border-white/5 text-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-sm text-slate-500 font-medium">
                        <p>© {new Date().getFullYear()} {user?.name ?? 'User'}. All rights reserved.</p>
                        <div className="flex items-center gap-8">
                            <Link href="/privacy" className="hover:text-primary cursor-pointer transition-colors px-1">Privacy Policy</Link>
                            <Link href="/terms" className="hover:text-primary cursor-pointer transition-colors px-1">Terms of Service</Link>
                        </div>
                        <p className="font-black tracking-widest text-slate-400 text-[10px] uppercase">
                             POWERED BY <span className="text-primary italic">PATHCHAKRO</span>
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
