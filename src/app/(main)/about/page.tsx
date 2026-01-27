import React from 'react';
import { BookOpen, PenTool, Users, GraduationCap, Map, Calendar } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl sm:tracking-tight lg:text-6xl mb-4">
                    About <span className="text-primary">Pathchakro</span>
                </h1>
                <p className="max-w-xl mx-auto text-xl text-muted-foreground">
                    Connect, share, and learn. A social platform dedicated to book lovers, students, and educators on a journey of discovery.
                </p>
            </div>

            {/* Mission Section */}
            <div className="prose prose-lg dark:prose-invert mx-auto mb-16 text-center">
                <p>
                    <strong>Pathchakro</strong> (roughly translating to "The Circle of the Path" or "Journey's Cycle") is more than just a social media platform; it's a thriving ecosystem for the curious mind. We believe that learning and creativity are communal activities, best experienced together.
                </p>
                <p>
                    Whether you are an aspiring author looking to publish your first book, a student seeking knowledge, or a reader wanting to share your latest find, Pathchakro provides the tools and community to support your journey.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                        <PenTool className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Write & Publish</h3>
                    <p className="text-muted-foreground">
                        Unleash your inner author. Write books, publish chapters, and get feedback from a community of readers.
                    </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Social Learning</h3>
                    <p className="text-muted-foreground">
                        Connect with peers and mentors. Share posts, ask questions, and grow your network of knowledge.
                    </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                        <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Courses & Assignments</h3>
                    <p className="text-muted-foreground">
                        Engage in structured learning. Participate in courses and complete assignments to enhance your skills.
                    </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Book Reviews</h3>
                    <p className="text-muted-foreground">
                        Discover your next favorite read. Browse user reviews and share your own thoughts on literature.                    </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Events</h3>
                    <p className="text-muted-foreground">
                        Stay updated with literary gatherings, workshops, and educational meetups happening around you.
                    </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                        <Map className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Tours</h3>
                    <p className="text-muted-foreground">
                        Explore new places and ideas. Join educational tours and field trips organized by the community.
                    </p>
                </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-muted-foreground text-sm border-t pt-8">
                <p>&copy; {new Date().getFullYear()} Pathchakro. All rights reserved.</p>
                <p className="mt-2">Built with modern web technologies to empower the next generation of thinkers.</p>
            </div>
        </div>
    );
}
