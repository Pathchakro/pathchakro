'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Star, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PortfolioAuthoredBooksProps {
    userId: string;
}

export function PortfolioAuthoredBooks({ userId }: PortfolioAuthoredBooksProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const fetchWritingProjects = async () => {
            try {
                // Fetching only writing projects authored by this user
                const response = await fetch(`/api/writing?author=${userId}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                if (data.projects) {
                    setProjects(data.projects);
                }
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error('Error fetching writing projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWritingProjects();
        
        return () => {
            controller.abort();
        };
    }, [userId]);

    if (!loading && projects.length === 0) return null;

    return (
        <section id="works" className="py-24 relative overflow-hidden bg-[#020617]">
             {/* Primary Theme Background Accent */}
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="space-y-16">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            Published <span className="text-primary italic">Works</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-xl">
                            A curated gallery of literature and original stories authored by me, shared for fellow enthusiasts.
                        </p>
                    </div>
                    {projects.length > 0 && (
                        <Link href="/writing" className="group flex items-center gap-2 text-primary font-bold hover:underline transition-all">
                             All Projects <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Syncing publication records...</p>
                    </div>
                ) : (
                    /* Horizontal Carousel */
                    <div className="relative group">
                        <div className="flex overflow-x-auto gap-8 px-6 md:px-[calc((100vw-min(1280px,94vw))/2)] pb-12 snap-x snap-mandatory scrollbar-hide no-scrollbar">
                            {projects.map((project, idx) => (
                                <motion.div 
                                    key={project._id}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    className="flex-shrink-0 w-[320px] md:w-[420px] snap-center"
                                >
                                    <div className="group/card relative bg-[#0f172a] border border-white/5 rounded-[40px] overflow-hidden flex flex-col h-[580px] hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="relative h-72 w-full bg-slate-800 overflow-hidden">
                                             {project.coverImage ? (
                                                 <Image 
                                                    src={project.coverImage} 
                                                    alt={project.title} 
                                                    fill 
                                                    className="object-cover transition-transform duration-700 group-hover/card:scale-110" 
                                                 />
                                             ) : (
                                                 <div className="w-full h-full flex items-center justify-center bg-slate-800 text-primary/20 group-hover/card:text-primary transition-colors">
                                                     <Book className="h-32 w-32" />
                                                 </div>
                                             )}
                                             
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover/card:opacity-100 transition-opacity z-10" />
                                             
                                             <div className="absolute bottom-8 left-8 right-8 opacity-0 group-hover/card:opacity-100 transition-all transform translate-y-4 group-hover/card:translate-y-0 z-20">
                                                <Link href={`/writing/${project.slug}`} className="w-full bg-white text-black h-14 rounded-2xl flex items-center justify-center font-bold gap-3 hover:bg-primary hover:text-white transition-all shadow-xl">
                                                    <ExternalLink className="h-5 w-5" /> Detailed View
                                                </Link>
                                             </div>

                                             <div className="absolute top-6 right-6 z-20">
                                                 <span className="px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase border border-white/10">
                                                      {project.status || 'Published'}
                                                 </span>
                                             </div>
                                        </div>

                                        <div className="p-10 flex-1 flex flex-col justify-between space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h3 className="text-3xl font-bold group-hover/card:text-primary transition-colors line-clamp-1 tracking-tight">
                                                        {project.title}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(Array.isArray(project.category) ? project.category : (project.category ? [project.category] : ['Literature'])).map((cat: string) => (
                                                        <span key={cat} className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
                                                    {project.introduction || project.description || "An original literary journey exploring complex themes and captivating narratives created through years of dedication."}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                                                <div className="flex items-center gap-4">
                                                     <div className="flex flex-col">
                                                          <span className="text-xl font-black text-white">{project.totalChapters || 0}</span>
                                                          <span className="text-[10px] text-slate-500 font-bold uppercase">Chapters</span>
                                                     </div>
                                                     <div className="w-px h-8 bg-white/5" />
                                                     <div className="flex flex-col">
                                                          <span className="text-xl font-black text-white">{project.totalWords?.toLocaleString() || 0}</span>
                                                          <span className="text-[10px] text-slate-500 font-bold uppercase">Words</span>
                                                     </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                                    <Star className="h-4 w-4 fill-current" />
                                                    <span>{project.rating?.toFixed(1) || '0.0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Scroll Hint Gradient */}
                        <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-[#020617] to-transparent pointer-events-none opacity-60" />
                    </div>
                )}
            </div>
        </section>
    );
}
