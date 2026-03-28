'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Bookmark, Library, User, MapPin, Heart, GraduationCap, CheckCircle2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioStatsProps {
    user: any;
    stats: any;
}

export function PortfolioStats({ user }: PortfolioStatsProps) {
    const interests = user.bookPreferences || user.interests || [];
    
    // Format Present Address
    const presentAddress = [user.address?.present?.district, user.address?.present?.division]
        .filter(Boolean)
        .join(', ');

    const hasAcademic = user.academic?.institution || user.university;

    return (
        <section className="py-20 px-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-16 items-start">
                {/* About Me Text */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full space-y-12"
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tight">
                                <span className="text-primary italic">#</span> About {user.name?.split(' ')[0] || 'Member'}
                            </h2>
                            <div className="w-20 h-2 bg-primary rounded-full" />
                        </div>
                        
                        <p className="text-xl leading-relaxed text-muted-foreground whitespace-pre-wrap max-w-3xl">
                            {user.bio || "An avid reader with a deep appreciation for storytelling and knowledge."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Interests Column */}
                        {interests.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Heart className="h-3 w-3 text-primary fill-current" /> Literary Interests
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {interests.map((interest: string) => (
                                        <span key={interest} className="px-4 py-2 bg-primary/5 border border-primary/10 text-primary-foreground/90 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all cursor-default">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Column */}
                        {presentAddress && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 flex items-center gap-2">
                                    <MapPin className="h-3 w-3 fill-current" /> Current Location
                                </h4>
                                <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-[#0f172a] hover:border-sky-400/20 transition-all group">
                                    <div className="p-3 rounded-xl bg-sky-400/10 text-sky-400 group-hover:bg-sky-400 group-hover:text-white transition-all">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black text-xl text-white leading-tight">{presentAddress}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Education Spotlight - Full width highlight */}
                    {hasAcademic && (
                        <div className="space-y-6 pt-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                <GraduationCap className="h-3 w-3 text-primary" /> Qualifications
                            </h4>
                            <div className="bg-[#111827] border border-white/5 p-10 rounded-[48px] space-y-8 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 text-primary/10 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Library className="h-32 w-32" />
                                </div>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-white group-hover:text-primary transition-colors tracking-tighter">
                                                {user.academic?.degree || "Academic Excellence"}
                                            </h3>
                                            <p className="text-xl font-bold text-slate-400">
                                                {user.academic?.institution || user.university}
                                            </p>
                                        </div>
                                        <span className="self-start md:self-center px-6 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                                            {user.academic?.graduationYear ? `Graduated ${user.academic.graduationYear}` : 'University Graduate'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-8 pt-6 border-t border-white/5">
                                        {user.academic?.fieldOfStudy && (
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <span className="text-sm font-black uppercase tracking-widest">Major: {user.academic.fieldOfStudy}</span>
                                            </div>
                                        )}
                                        {user.academic?.gpa && (
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <div className="p-2 rounded-lg bg-yellow-500/10">
                                                    <Award className="h-5 w-5 text-yellow-500" />
                                                </div>
                                                <span className="text-sm font-black uppercase tracking-widest">Awarded: {user.academic.gpa} CGPA</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
