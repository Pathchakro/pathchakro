'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Search, AlertCircle } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
    _id: string;
    sender: { _id: string; name: string; image?: string };
    recipient: { _id: string; name: string; image?: string };
    content: string;
    createdAt: string;
    read: boolean;
}

interface Conversation {
    userId: string;
    userName: string;
    userImage?: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
}

export default function MessagesClient({ initialMessages, userId }: { initialMessages: Message[], userId: string }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Transform initial messages to conversation list with latest messages
        const convMap = new Map<string, Conversation>();
        
        initialMessages.forEach((msg) => {
            const partner = msg.sender._id === userId ? msg.recipient : msg.sender;
            if (!partner?._id) return;
            
            const existing = convMap.get(partner._id);
            const msgTime = new Date(msg.createdAt).getTime();
            
            if (!existing || msgTime > new Date(existing.timestamp).getTime()) {
                convMap.set(partner._id, {
                    userId: partner._id,
                    userName: partner.name || 'User',
                    userImage: partner.image,
                    lastMessage: msg.content,
                    timestamp: msg.createdAt,
                    unread: !msg.read && msg.recipient._id === userId
                });
            }
        });
        
        // Sort conversations by latest message timestamp
        const sortedConvs = Array.from(convMap.values()).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setConversations(sortedConvs);
    }, [initialMessages, userId]);

    const fetchChatMessages = async (partnerId: string) => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch(`/api/messages?userId=${partnerId}`, {
                signal: controller.signal
            });
            if (!res.ok) throw new Error('Failed to load conversation');
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
                // Mark conversation as read locally if active
                setConversations(prev => prev.map(c => 
                    c.userId === partnerId ? { ...c, unread: false } : c
                ));
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error(err);
            setFetchError(err.message || 'Could not load messages');
            toast.error(err.message || 'Could not load messages');
        } finally {
            if (abortControllerRef.current === controller) {
                setLoading(false);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeUserId) return;
        const messageContent = newMessage;
        setNewMessage('');
        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId: activeUserId, content: messageContent }),
            });
            if (res.ok) {
                fetchChatMessages(activeUserId);
            } else {
                setNewMessage(messageContent); // Restore on failure
                toast.error('Failed to send message');
            }
        } catch (err) {
            console.error(err);
            setNewMessage(messageContent);
            toast.error('Connection error');
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = useMemo(() => 
        conversations.filter(c => c.userName.toLowerCase().includes(searchQuery.toLowerCase())),
    [conversations, searchQuery]);

    const activeConversation = conversations.find(c => c.userId === activeUserId);

    return (
        <div className="max-w-7xl mx-auto p-4 h-[calc(100vh-140px)] flex flex-col">
            <h1 className="text-4xl font-black mb-8 tracking-tight">Inbox</h1>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
                {/* Contacts List */}
                <div className="lg:col-span-1 bg-card border-2 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                    <div className="p-6 border-b-2 bg-muted/10">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="Search conversations..." 
                                className="pl-12 h-12 bg-white/50 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 transition-all" 
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredConversations.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <p className="font-bold">No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const initial = (conv.userName?.[0] || '?').toUpperCase();
                                return (
                                    <button 
                                        key={conv.userId} 
                                        onClick={() => { setActiveUserId(conv.userId); fetchChatMessages(conv.userId); }}
                                        className={`w-full p-5 flex gap-4 border-b-2 hover:bg-muted/50 transition-all group ${activeUserId === conv.userId ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                                    >
                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                                            {initial}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className={`font-black text-sm truncate ${conv.unread ? 'text-primary' : ''}`}>
                                                    {conv.userName}
                                                </p>
                                                <p className="text-[10px] font-black text-muted-foreground opacity-60">
                                                    {formatTime(conv.timestamp)}
                                                </p>
                                            </div>
                                            <p className={`text-xs truncate ${conv.unread ? 'font-black text-foreground' : 'text-muted-foreground font-medium'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {conv.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-6 shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-card border-2 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                    {activeUserId ? (
                        <>
                            <div className="px-6 py-4 border-b-2 flex items-center gap-4 bg-muted/10 backdrop-blur-md">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-black">
                                    {(activeConversation?.userName?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black leading-none">{activeConversation?.userName || 'Unknown User'}</p>
                                    <p className="text-[10px] font-bold text-green-500 mt-1 uppercase tracking-wider">Active Conversation</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(#f1f1f1_1px,transparent_1px)] [background-size:20px_20px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground animate-in fade-in">
                                        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <p className="font-black text-sm tracking-widest uppercase opacity-50">Syncing Conversation...</p>
                                    </div>
                                ) : fetchError ? (
                                    <div className="flex flex-col items-center justify-center h-full text-destructive gap-4">
                                        <AlertCircle className="h-10 w-10" />
                                        <p className="font-black">{fetchError}</p>
                                        <Button variant="outline" onClick={() => fetchChatMessages(activeUserId!)} className="rounded-xl font-bold">Try Again</Button>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.sender._id === userId;
                                        return (
                                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                                <div className={`max-w-[75%] p-5 rounded-[1.5rem] shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white border-2 rounded-tl-none'}`}>
                                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-2 font-black ${isMe ? 'text-white/60' : 'text-muted-foreground opacity-60'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-6 border-t-2 bg-muted/5">
                                <div className="flex gap-3 items-end">
                                    <Textarea 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        placeholder="Type your message..." 
                                        rows={1} 
                                        className="rounded-2xl resize-none border-2 h-14 py-4 px-6 focus:ring-primary/20 font-medium" 
                                    />
                                    <Button 
                                        onClick={handleSendMessage} 
                                        disabled={sending || !newMessage.trim()} 
                                        className="rounded-2xl h-14 px-8 font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px]">
                            <div className="h-24 w-24 bg-muted rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                <MessageCircle className="h-12 w-12 opacity-10" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-3">Your Messages</h3>
                            <p className="font-bold text-sm max-w-xs mx-auto">Select a contact from the left to start a conversation. Your messages are private and secure.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
