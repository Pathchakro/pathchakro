'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Book, Sparkles, MapPin, Mail, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Top', icon: Home, id: 'hero' },
    { label: 'About', icon: User, id: 'about' },
    { label: 'Skills', icon: Sparkles, id: 'expertise' },
    { label: 'Works', icon: Book, id: 'works' },
    { label: 'Journey', icon: MapPin, id: 'journey' },
    { label: 'Contact', icon: Mail, id: 'contact' },
];

export function PortfolioScrollNav() {
    const [activeSection, setActiveSection] = useState('hero');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 300);

                    const sections = navItems.map(item => document.getElementById(item.id));
                    const scrollPosition = window.scrollY + 150;

                    const current = sections.find(section => {
                        if (!section) return false;
                        const offsetTop = section.offsetTop;
                        const offsetHeight = section.offsetHeight;
                        return scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight;
                    });

                    if (current) {
                        setActiveSection(current.id);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    return (
        <AnimatePresence>
            {scrolled && (
                <motion.nav
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    aria-label="Portfolio sections"
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl shadow-black/50"
                >
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                aria-label={`Scroll to ${item.label}`}
                                aria-current={isActive ? 'location' : undefined}
                                className={cn(
                                    "relative px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all group overflow-hidden",
                                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-bg"
                                        className="absolute inset-0 bg-primary rounded-full -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                <span 
                                    aria-hidden="true"
                                    className={cn(
                                        "transition-all",
                                        isActive ? "block" : "hidden md:group-hover:block"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
