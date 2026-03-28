'use client';

import { motion } from 'framer-motion';
import { Download, Mail, Github, Linkedin, Twitter, Facebook, MessageCircle, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PortfolioHeroProps {
    user: any;
    isOwnProfile?: boolean;
}

export function PortfolioHero({ user, isOwnProfile }: PortfolioHeroProps) {
    const getRankColor = (tier: string) => {
        const colors = {
            'Master': 'from-purple-500 via-pink-500 to-red-500',
            'Scholar': 'from-blue-500 via-cyan-500 to-teal-500',
            'Critic': 'from-green-500 via-emerald-500 to-lime-500',
            'Reader': 'from-yellow-500 via-orange-500 to-amber-500',
            'Beginner': 'from-gray-400 via-slate-500 to-gray-600',
        };
        return colors[tier as keyof typeof colors] || colors.Beginner;
    };

    const interests = (user.bookPreferences?.length ? user.bookPreferences : user.interests) || [];

    const cleanPhoneNumber = (phone: string) => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, ''); // Remove non-numeric
        // If it starts with 0 and isn't long enough (local number), prepend 88
        if (cleaned.startsWith('0') && cleaned.length === 11) {
            return `88${cleaned}`;
        }
        // If it already starts with 88, return as is
        if (cleaned.startsWith('88')) {
            return cleaned;
        }
        // Fallback for other cases
        return cleaned;
    };

    const whatsappLink = user.whatsappNumber ? cleanPhoneNumber(user.whatsappNumber) : user.phone ? cleanPhoneNumber(user.phone) : '';

    return (
        <section className="relative min-h-[500px] flex flex-col md:flex-row items-center justify-between gap-12 py-16 px-6 overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full" />

            {/* Left Content */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 space-y-8 text-center md:text-left"
            >
                <div className="space-y-3">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center md:justify-start gap-4"
                    >
                        <h4 className="text-primary font-black tracking-widest uppercase text-xs bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                            {user.rankTier || 'Beginner'}
                        </h4>
                        
                        {user.bloodGroup && (
                            <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 text-xs font-black uppercase tracking-tighter shadow-sm">
                                <Droplet className="h-3.5 w-3.5 fill-current" />
                                <span>Group: {user.bloodGroup}</span>
                            </div>
                        )}
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
                        {user.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-muted-foreground/80 italic">
                        {user.title || user.profileType || 'Avid Reader & Contributor'}
                    </p>
                </div>

                {/* Interest Badges */}
                {interests.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 max-w-lg">
                        {interests.slice(0, 5).map((interest: string) => (
                            <span key={interest} className="px-4 py-2 bg-slate-800/50 border border-white/5 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all">
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {/* Social Icons & Contact */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                    <div className="flex items-center gap-4">
                        {whatsappLink && (
                            <a 
                                href={`https://wa.me/${whatsappLink}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="Chat on WhatsApp"
                                className="group flex items-center gap-2 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-emerald-500/5"
                            >
                                <MessageCircle className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-widest pr-2">Chat now</span>
                            </a>
                        )}

                        <div className="flex items-center gap-3">
                            {user.social?.github && (
                                <a 
                                    href={user.social.github} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    aria-label="GitHub profile"
                                    className="p-3 rounded-2xl border bg-card/40 backdrop-blur-md hover:text-primary transition-all hover:-translate-y-1 shadow-sm"
                                >
                                    <Github className="h-6 w-6" />
                                </a>
                            )}
                            {user.social?.linkedin && (
                                <a 
                                    href={user.social.linkedin} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn profile"
                                    className="p-3 rounded-2xl border bg-card/40 backdrop-blur-md hover:text-[#0077b5] transition-all hover:-translate-y-1 shadow-sm"
                                >
                                    <Linkedin className="h-6 w-6" />
                                </a>
                            )}
                            {user?.email && (
                                <a 
                                    href={`mailto:${user.email}`} 
                                    aria-label="Send email"
                                    className="p-3 rounded-2xl border bg-card/40 backdrop-blur-md hover:text-primary transition-all hover:-translate-y-1 shadow-sm"
                                >
                                    <Mail className="h-6 w-6" />
                                </a>
                            )}
                            {user.social?.facebook && (
                                <a 
                                    href={user.social.facebook} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    aria-label="Facebook profile"
                                    className="p-3 rounded-2xl border bg-card/40 backdrop-blur-md hover:text-[#1877F2] transition-all hover:-translate-y-1 shadow-sm"
                                >
                                    <Facebook className="h-6 w-6" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Content - Avatar */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative flex-shrink-0"
            >
                {/* Glow Ring */}
                <div className={`absolute -inset-4 bg-gradient-to-tr ${getRankColor(user.rankTier || 'Beginner')} rounded-full opacity-20 blur-2xl animate-pulse`} />
                <div className={`absolute -inset-1 bg-gradient-to-tr ${getRankColor(user.rankTier || 'Beginner')} rounded-full opacity-40`} />
                
                <div className="relative h-64 w-64 md:h-80 md:w-80 rounded-full border-4 border-background bg-card overflow-hidden shadow-2xl">
                    {user.image ? (
                        <Image 
                            src={user.image} 
                            alt={user.name} 
                            fill 
                            className="object-cover transition-transform hover:scale-110 duration-700" 
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getRankColor(user.rankTier || 'Beginner')} flex items-center justify-center text-6xl font-bold text-white`}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                
                {/* Visual Accent Dots */}
                <div className="absolute top-0 -right-4 w-4 h-4 rounded-full bg-primary animate-bounce delay-100" />
                <div className="absolute bottom-10 -left-6 w-3 h-3 rounded-full bg-blue-400 animate-bounce delay-300" />
            </motion.div>
        </section>
    );
}
