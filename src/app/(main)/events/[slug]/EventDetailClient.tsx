'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Video, Users, Clock, ArrowLeft, User, Mic } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface Event {
    _id: string;
    organizer: {
        _id: string;
        name: string;
        image?: string;
    };
    team?: {
        _id: string;
        name: string;
    };
    title: string;
    description: string;
    eventType: string;
    location?: string;
    meetingLink?: string;
    startTime: string;
    endTime: string;
    status: string;
    banner?: string;
    roles: {
        host?: { user: { _id: string; name: string; image?: string } };
        anchor?: { user: { _id: string; name: string; image?: string } };
        summarizer?: { user: { _id: string; name: string; image?: string } };
        opener?: { user: { _id: string; name: string; image?: string } };
        closer?: { user: { _id: string; name: string; image?: string } };
        lecturers: Array<{
            user: { _id: string; name: string; image?: string };
            topic: string;
            duration: number;
            order: number;
        }>;
    };
    listeners: Array<{
        user: { _id: string; name: string; image?: string };
    }>;
    createdAt: string;
}

export default function EventDetailClient({ slug, initialData }: { slug: string; initialData?: Event }) {
    const [event, setEvent] = useState<Event | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [isJoining, setIsJoining] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [lectureTopic, setLectureTopic] = useState('');
    const [lectureDuration, setLectureDuration] = useState(2);

    useEffect(() => {
        if (!initialData) {
            fetchEvent();
        }
    }, [slug, initialData]);

    const fetchEvent = async () => {
        try {
            // Options 'cache' and 'next.tags' are removed as they are server-side only
            const response = await fetch(`/api/events/${slug}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.event) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRole = async () => {
        if (!event) return;

        if (!selectedRole) {
            alert('Please select a role');
            return;
        }

        if (selectedRole === 'lecturer' && !lectureTopic.trim()) {
            alert('Please enter your lecture topic');
            return;
        }

        setIsJoining(true);
        try {
            const response = await fetch(`/api/events/${event._id}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: selectedRole,
                    topic: lectureTopic || undefined,
                    duration: lectureDuration,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                setSelectedRole('');
                setLectureTopic('');
                setLectureDuration(2);
                fetchEvent();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error joining event:', error);
            alert('Failed to register. Please try again.');
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading event...
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Event not found</h2>
                    <Link href="/events">
                        <Button>Back to Events</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const availableRoles = [
        { id: 'host', label: 'Host', taken: !!event.roles.host },
        { id: 'anchor', label: 'Anchor', taken: !!event.roles.anchor },
        { id: 'summarizer', label: 'Summarizer', taken: !!event.roles.summarizer },
        { id: 'opener', label: 'Event Opener', taken: !!event.roles.opener },
        { id: 'closer', label: 'Event Closer', taken: !!event.roles.closer },
        { id: 'lecturer', label: 'Lecturer', taken: event.roles.lecturers.length >= 5 },
        { id: 'listener', label: 'Listener', taken: false },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4">
            <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
            </Link>

            {/* Event Header */}
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-4">
                {event.banner && (
                    <div className="mb-6 rounded-lg overflow-hidden w-full h-64 md:h-80 lg:h-96 relative">
                        <Image
                            src={event.banner}
                            alt={event.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                        <p className="text-muted-foreground">{event.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                            event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                        }`}>
                        {event.status.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">{formatDate(event.startTime)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Time</p>
                            <p className="font-medium">
                                {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {event.eventType === 'online' ? (
                        <div className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Meeting Link</p>
                                <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                                    Join Online
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-medium">{event.location}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Participants</p>
                            <p className="font-medium">{event.listeners.length} listeners</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        Organized by <span className="font-medium text-foreground">{event.organizer.name}</span>
                        {event.team && <> • Team: <span className="font-medium text-foreground">{event.team.name}</span></>}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Roles & Participants */}
                <div className="bg-card rounded-lg shadow-sm border p-6">
                    <h2 className="font-semibold text-lg mb-4">Event Roles</h2>

                    <div className="space-y-3">
                        {/* Special Roles */}
                        {[
                            { key: 'host', label: 'Host', role: event.roles.host },
                            { key: 'anchor', label: 'Anchor', role: event.roles.anchor },
                            { key: 'summarizer', label: 'Summarizer', role: event.roles.summarizer },
                            { key: 'opener', label: 'Event Opener', role: event.roles.opener },
                            { key: 'closer', label: 'Event Closer', role: event.roles.closer },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="font-medium">{item.label}</span>
                                {item.role?.user ? (
                                    <span className="text-sm text-green-600">✓ {item.role.user.name}</span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Available</span>
                                )}
                            </div>
                        ))}

                        {/* Lecturers */}
                        <div className="p-2 bg-muted rounded">
                            <div className="font-medium mb-2">Lecturers ({event.roles.lecturers.length}/5)</div>
                            {event.roles.lecturers.length > 0 ? (
                                <div className="space-y-2">
                                    {event.roles.lecturers.map((lecturer, index) => (
                                        <div key={index} className="text-sm bg-card p-2 rounded">
                                            <p className="font-medium">{lecturer.user.name}</p>
                                            <p className="text-muted-foreground">{lecturer.topic}</p>
                                            <p className="text-xs text-muted-foreground">{lecturer.duration} minutes</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No lecturers yet</p>
                            )}
                        </div>

                        {/* Listeners */}
                        <div className="p-2 bg-muted rounded">
                            <div className="font-medium mb-2">Listeners ({event.listeners.length})</div>
                            {event.listeners.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {event.listeners.slice(0, 10).map((listener, index) => (
                                        <span key={index} className="text-xs bg-card px-2 py-1 rounded">
                                            {listener.user.name}
                                        </span>
                                    ))}
                                    {event.listeners.length > 10 && (
                                        <span className="text-xs text-muted-foreground">+{event.listeners.length - 10} more</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Join Event */}
                <div className="bg-card rounded-lg shadow-sm border p-6">
                    <h2 className="font-semibold text-lg mb-4">Register for Event</h2>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="role">Select Role</Label>
                            <select
                                id="role"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            >
                                <option value="">Choose a role...</option>
                                {availableRoles.map((role) => (
                                    <option key={role.id} value={role.id} disabled={role.taken}>
                                        {role.label} {role.taken && '(Taken)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedRole === 'lecturer' && (
                            <>
                                <div>
                                    <Label htmlFor="topic">Lecture Topic *</Label>
                                    <Input
                                        id="topic"
                                        value={lectureTopic}
                                        onChange={(e) => setLectureTopic(e.target.value)}
                                        placeholder="Your lecture topic..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={lectureDuration}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 2;
                                            setLectureDuration(Math.min(10, Math.max(1, val)));
                                        }}
                                    />                                </div>
                            </>
                        )}

                        <Button
                            onClick={handleJoinRole}
                            disabled={!selectedRole || isJoining}
                            className="w-full"
                        >
                            {isJoining ? 'Registering...' : 'Register'}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            You can only register for one role per event
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
