'use client';

import { GraduationCap, Briefcase, Heart, Globe, Github, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileAboutProps {
    user: any;
}

export function ProfileAbout({ user }: ProfileAboutProps) {
    const socialIcons: any = {
        github: Github,
        linkedin: Linkedin,
        twitter: Twitter,
        facebook: Facebook,
        website: Globe
    };

    const hasSocialLinks = !!(user.website || (user.social && Object.values(user.social).some(Boolean)));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic Info */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg">Academic Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user.academic?.currentEducation ? (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Current Education</p>
                                <p className="font-medium">{user.academic.currentEducation}</p>
                            </div>
                            {user.academic.institution && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Institution</p>
                                    <p className="font-medium">{user.academic.institution}</p>
                                </div>
                            )}
                            {user.academic.degree && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Degree</p>
                                    <p className="font-medium">
                                        {user.academic.degree}
                                        {user.academic.fieldOfStudy && ` in ${user.academic.fieldOfStudy}`}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No academic information provided.</p>
                    )}
                </CardContent>
            </Card>

            {/* Career Info */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                    </div>
                    <CardTitle className="text-lg">Professional Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user.career?.currentPosition ? (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Current Position</p>
                                <p className="font-medium">{user.career.currentPosition}</p>
                            </div>
                            {user.career.company && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Company/Organization</p>
                                    <p className="font-medium">{user.career.company}</p>
                                </div>
                            )}
                            {user.career.skills?.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.career.skills.map((skill: string, index: number) => (
                                            <span key={`${skill}-${index}`} className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No career information provided.</p>
                    )}
                </CardContent>
            </Card>

            {/* Interests */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Heart className="h-5 w-5 text-pink-500" />
                    </div>
                    <CardTitle className="text-lg">Interests</CardTitle>
                </CardHeader>
                <CardContent>
                    {user.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.interests.map((interest: string, index: number) => (
                                <span key={`${interest}-${index}`} className="px-3 py-1 bg-pink-500/5 text-pink-600 border border-pink-500/10 rounded-full text-xs font-semibold">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No interests listed.</p>
                    )}
                </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Globe className="h-5 w-5 text-emerald-500" />
                    </div>
                    <CardTitle className="text-lg">Social & Links</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(user.social || {}).map(([platform, link]) => {
                            if (!link) return null;
                            const Icon = socialIcons[platform] || Globe;
                            return (
                                <a
                                    key={platform}
                                    href={link as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors border group"
                                >
                                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-xs font-medium capitalize truncate">{platform}</span>
                                </a>
                            );
                        })}
                        {user.website && !user.social?.website && (
                             <a
                                href={user.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors border group"
                             >
                                 <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                 <span className="text-xs font-medium capitalize truncate">Website</span>
                             </a>
                        )}
                    </div>
                    {!hasSocialLinks && (
                        <p className="text-sm text-muted-foreground italic">No social links provided.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
