'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatResponse, ChatMessage } from '@/services/geminiService';
import { useSession } from 'next-auth/react';

export function Chatbot() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: "Hi! I'm the Pathchakro AI assistant. How can I help you discover books or navigate the community today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        const newHistory: ChatMessage[] = [
            ...messages,
            { role: 'user', parts: userMessage }
        ];
        setMessages(newHistory);
        setIsLoading(true);

        try {
            const responseText = await getChatResponse(userMessage, messages);
            setMessages(prev => [...prev, { role: 'model', parts: responseText }]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', parts: `Error: ${error.message || 'Something went wrong. Please try again.'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-20 right-4 z-50 w-[350px] sm:w-[400px] shadow-2xl"
                    >
                        <Card className="border-primary/20 bg-background/95 backdrop-blur-md h-[500px] flex flex-col overflow-hidden ring-1 ring-primary/10">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-orange-500/10 p-4 border-b border-primary/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-sm font-medium">Pathchakro Assistant</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent
                                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin touch-auto"
                            >
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex gap-3 text-sm mb-4",
                                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border overflow-hidden relative",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted text-muted-foreground border-muted"
                                        )}>
                                            {msg.role === 'user' ? (
                                                session?.user?.image ? (
                                                    <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="font-bold">{session?.user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}</span>
                                                )
                                            ) : (
                                                <Bot className="h-4 w-4" />
                                            )}
                                        </div>

                                        <div className={cn(
                                            "rounded-2xl px-4 py-2.5 max-w-[80%] shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-muted-foreground rounded-tl-none"
                                        )}>
                                            {msg.parts}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 text-sm mb-4">
                                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-muted text-muted-foreground border-muted overflow-hidden relative">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center shadow-sm">
                                            <div className="flex space-x-1 h-4 items-center px-1">
                                                <motion.div
                                                    className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                />
                                                <motion.div
                                                    className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                />
                                                <motion.div
                                                    className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <CardFooter className="p-4 border-t border-primary/10 bg-muted/20">
                                <form onSubmit={handleSubmit} className="flex w-full gap-2">
                                    <Input
                                        placeholder="Ask me anything..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        disabled={isLoading}
                                        className="flex-1 focus-visible:ring-primary/20"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navbar Trigger Button */}
            {!isOpen && (
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                    <HelpCircle className="h-5 w-5" />
                </Button>
            )}
        </>
    );
}