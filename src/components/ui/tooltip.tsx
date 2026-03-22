"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface TooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    className?: string
}

export function Tooltip({ children, content, className }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false)
    const id = React.useId()

    return (
        <div 
            className="relative inline-block focus:outline-none"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            tabIndex={0}
            aria-describedby={id}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        id={id}
                        role="tooltip"
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-xl whitespace-nowrap pointer-events-none",
                            className
                        )}
                    >
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
