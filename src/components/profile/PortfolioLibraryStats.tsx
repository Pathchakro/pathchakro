'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, MessageSquare, Library } from 'lucide-react';

interface PortfolioLibraryStatsProps {
    stats: any;
}

export function PortfolioLibraryStats({ stats }: PortfolioLibraryStatsProps) {
    const lib = stats?.library || { completed: 0, reading: 0, wishlist: 0, total: 0 };

    const statCards = [
        { 
            label: 'Completed', 
            value: lib.completed, 
            icon: CheckCircle, 
            color: 'text-green-500', 
            bg: 'bg-green-500/10',
            description: 'Books finished'
        },
        { 
            label: 'Reading', 
            value: lib.reading, 
            icon: BookOpen, 
            color: 'text-blue-500', 
            bg: 'bg-blue-500/10',
            description: 'Currently exploring'
        },
        { 
            label: 'Reviews', 
            value: stats?.reviews || 0, 
            icon: MessageSquare, 
            color: 'text-amber-500', 
            bg: 'bg-amber-500/10',
            description: 'Books reviewed'
        },
        { 
            label: 'Library', 
            value: lib.total, 
            icon: Library, 
            color: 'text-purple-500', 
            bg: 'bg-purple-500/10',
            description: 'Total collection'
        },
    ];

    return (
        <section className="py-24 px-6 bg-slate-900/50 border-y border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                    {statCards.map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-900/80 border border-white/5 rounded-[40px] p-10 shadow-2xl flex flex-col items-center justify-center text-center gap-6 group cursor-default transition-all hover:bg-slate-800 hover:border-primary/20"
                        >
                            <div className={`p-6 rounded-[28px] ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
                                <stat.icon className="h-12 w-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-6xl font-black text-white tracking-tighter">
                                    {stat.value}
                                </h3>
                                <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                                    {stat.label}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
