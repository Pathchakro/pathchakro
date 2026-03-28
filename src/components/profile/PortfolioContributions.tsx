'use client';

import { motion } from 'framer-motion';
import { Book, Edit3, Github, Globe, ExternalLink, ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PortfolioContributionsProps {
    // user: any; // TODO: Implement specific user fetching for contributions
}

/**
 * PortfolioContributions Component
 * Showcase of user reviews, archival projects, and community contributions.
 * 
 * TODO:
 * - Wire up to receive real data from the user profile.
 * - Replace placeholders with actual user metrics and book data.
 */
export function PortfolioContributions() {
    // This section would ideally fetch the user's added books or recent reviews. 
    // For now, I'll create a smart placeholder or fetch if possible.

    return (
        <section className="py-24 px-6 bg-slate-900/10">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            My <span className="text-primary italic">Contributions</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-xl">
                            Showcasing the books, reviews, and literary projects I've shared with the community.
                        </p>
                    </div>
                    <Link href="/books" className="group flex items-center gap-2 text-primary font-bold hover:underline transition-all">
                        View All Books <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Project Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Placeholder Contribution 1 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="group bg-[#111827] border border-white/5 rounded-[32px] overflow-hidden flex flex-col hover:border-primary/30 transition-all hover:translate-y-[-8px] shadow-2xl shadow-black/40"
                    >
                        <div className="relative h-64 w-full bg-slate-800 overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-primary opacity-20 group-hover:opacity-40 transition-opacity">
                                 <Book className="h-32 w-32" />
                             </div>
                             <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 z-20 flex gap-4">
                                <button 
                                    className="flex-1 bg-white text-black h-12 rounded-xl flex items-center justify-center font-bold gap-2 hover:bg-primary hover:text-white transition-colors cursor-not-allowed opacity-90"
                                    aria-label="Live View (Coming Soon)"
                                    disabled
                                    title="Coming Soon"
                                >
                                    <ExternalLink className="h-4 w-4" /> Live View
                                </button>
                                <button 
                                    className="p-3 bg-slate-900/50 backdrop-blur-md rounded-xl text-white border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                                    aria-label="View on GitHub (Coming Soon)"
                                    title="Coming Soon"
                                >
                                    <Github className="h-5 w-5" />
                                </button>
                             </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">Classic Collection</h3>
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase">Literature</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                                Curating the finest works of classical literature for modern readers with insightful annotations.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Tags:</span>
                                <span className="text-xs font-bold text-primary">#Classic</span>
                                <span className="text-xs font-bold text-primary">#Analysis</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Placeholder Contribution 2 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="group bg-[#111827] border border-white/5 rounded-[32px] overflow-hidden flex flex-col hover:border-emerald-400/30 transition-all hover:translate-y-[-8px] shadow-2xl shadow-black/40"
                    >
                        <div className="relative h-64 w-full bg-slate-800 overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-emerald-400 opacity-20 group-hover:opacity-40 transition-opacity">
                                 <Star className="h-32 w-32" />
                             </div>
                             <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 z-20 flex gap-4">
                                <button 
                                    className="flex-1 bg-white text-black h-12 rounded-xl flex items-center justify-center font-bold gap-2 hover:bg-emerald-500 hover:text-white transition-colors cursor-not-allowed opacity-90"
                                    aria-label="Read Review (Coming Soon)"
                                    disabled
                                    title="Coming Soon"
                                >
                                    <ExternalLink className="h-4 w-4" /> Read Review
                                </button>
                             </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-bold group-hover:text-emerald-400 transition-colors">In-Depth Analysis</h3>
                                <span className="px-3 py-1 bg-emerald-400/10 text-emerald-400 rounded-full text-xs font-bold uppercase">Reviews</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                                Professional critiques focusing on character development and thematic depth in contemporary fiction.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Tags:</span>
                                <span className="text-xs font-bold text-emerald-400">#Critique</span>
                                <span className="text-xs font-bold text-emerald-400">#Thematic</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Placeholder Contribution 3 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="group bg-[#111827] border border-white/5 rounded-[32px] overflow-hidden flex flex-col hover:border-blue-400/30 transition-all hover:translate-y-[-8px] shadow-2xl shadow-black/40"
                    >
                        <div className="relative h-64 w-full bg-slate-800 overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-blue-400 opacity-20 group-hover:opacity-40 transition-opacity">
                                 <Edit3 className="h-32 w-32" />
                             </div>
                             <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 z-20 flex gap-4">
                                <button 
                                    className="flex-1 bg-white text-black h-12 rounded-xl flex items-center justify-center font-bold gap-2 hover:bg-blue-500 hover:text-white transition-colors cursor-not-allowed opacity-90"
                                    aria-label="Browse (Coming Soon)"
                                    disabled
                                    title="Coming Soon"
                                >
                                    <ExternalLink className="h-4 w-4" /> Browse
                                </button>
                             </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-bold group-hover:text-blue-400 transition-colors">Digital Archive</h3>
                                <span className="px-3 py-1 bg-blue-400/10 text-blue-400 rounded-full text-xs font-bold uppercase">Archival</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                                Preservation projects focusing on rare digital scans of out-of-print books and manuscripts.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Tags:</span>
                                <span className="text-xs font-bold text-blue-400">#Preservation</span>
                                <span className="text-xs font-bold text-blue-400">#Manuscripts</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
