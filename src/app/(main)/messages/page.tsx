'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, User, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Message {
    _id: string;
    sender: {
        _id: string;
        name: string;
        image?: string;
    };
    recipient: {
        _id: string;
        name: string;
        image?: string;
    };
    content: string;
    read: boolean;
    createdAt: string;
}

interface Conversation {
    userId: string;
    userName: string;
    userImage?: string;
    lastMessage: string;
    unread: boolean;
    timestamp: string;
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (activeUserId) {
            fetchMessages(activeUserId);
            const interval = setInterval(() => fetchMessages(activeUserId), 3000); // Poll every 3s
            return () => clearInterval(interval);
        }
    }, [activeUserId]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/messages');
            const data = await response.json();

            if (data.messages) {
                // Transform messages to conversations
                const convList: Conversation[] = data.messages.map((msg: any) => {
                    const isRecipient = msg.sender._id !== msg.sender._id; // Need to check with session
                    const partner = isRecipient ? msg.sender : msg.recipient;

                    return {
                        userId: partner._id,
                        userName: partner.name,
                        userImage: partner.image,
                        lastMessage: msg.content,
                        unread: !msg.read && isRecipient,
                        timestamp: msg.createdAt,
                    };
                });

                setConversations(convList);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const response = await fetch(`/api/messages?userId=${userId}`);
            const data = await response.json();

            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeUserId) return;

        setSending(true);
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipientId: activeUserId,
                    content: newMessage,
                }),
            });

            if (response.ok) {
                setNewMessage('');
                fetchMessages(activeUserId);
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="h-8 w-8" />
                Messages
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* Conversations List */}
                <div className="lg:col-span-1 bg-card border rounded-lg overflow-hidden flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-4 text-center text-muted-foreground">Loading...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No conversations yet</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.userId}
                                    onClick={() => setActiveUserId(conv.userId)}
                                    className={`w-full p-4 border-b hover:bg-muted transition-colors text-left ${activeUserId === conv.userId ? 'bg-muted' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                                            {conv.userName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`font-medium ${conv.unread ? 'text-foreground' : ''}`}>
                                                    {conv.userName}
                                                </p>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(conv.timestamp).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className={`text-sm line-clamp-1 ${conv.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'
                                                }`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-card border rounded-lg flex flex-col">
                    {activeUserId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                        {conversations.find(c => c.userId === activeUserId)?.userName[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {conversations.find(c => c.userId === activeUserId)?.userName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Active</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((msg) => {
                                    const isSender = msg.sender._id === activeUserId;

                                    return (
                                        <div
                                            key={msg._id}
                                            className={`flex ${isSender ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div className={`max-w-[70%] ${isSender ? 'bg-muted' : 'bg-primary text-primary-foreground'
                                                } rounded-lg p-3`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${isSender ? 'text-muted-foreground' : 'text-primary-foreground/70'
                                                    }`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="resize-none"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sending}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
