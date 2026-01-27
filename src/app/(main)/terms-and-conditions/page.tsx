import React from 'react';
import Link from 'next/link';
import { ScrollText, ShieldCheck, UserCheck, AlertTriangle, Copyright } from 'lucide-react';

export default function TermsAndConditionsPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <ScrollText className="h-16 w-16 mx-auto text-primary mb-4" />
                <h1 className="text-4xl font-extrabold text-foreground mb-4">Terms and Conditions</h1>
                <p className="text-muted-foreground">
                    Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    Welcome to Pathchakro. Please read these terms carefully before using our platform. By accessing or using Pathchakro, you agree to be bound by these terms.
                </p>
            </div>

            <div className="space-y-12 prose prose-gray dark:prose-invert max-w-none">
                {/* Section 1 */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold m-0">1. Acceptance of Terms</h2>
                    </div>
                    <p>
                        By accessing or using the Pathchakro website and services ("Service"), you agree to comply with and be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Service.
                    </p>
                </section>

                {/* Section 2 */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold m-0">2. User Accounts</h2>
                    </div>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li>You must be at least 13 years old to use this Service.</li>
                        <li>You are responsible for maintaining the confidentiality of your account and password.</li>
                        <li>You agree to accept responsibility for all activities that occur under your account.</li>
                        <li>We reserve the right to refuse service, terminate accounts, or remove content in our sole discretion.</li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <Copyright className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold m-0">3. Content Ownership & Rights</h2>
                    </div>
                    <p>
                        <strong>Your Content:</strong> You retain full ownership of any text, images, or other material ("Content") you post on Pathchakro, including your books, chapters, reviews, and comments.
                    </p>
                    <p className="mt-2">
                        <strong>License to Us:</strong> By posting Content, you grant Pathchakro a non-exclusive, worldwide, royalty-free license to host, display, and distribute your Content on our platform. This is necessary for us to show your work to other users.
                    </p>
                    <p className="mt-2">
                        <strong>Plagiarism:</strong> You must own or have the right to use all Content you post. Posting plagiarized work or violating copyright laws is strictly prohibited and will result in account termination.
                    </p>
                </section>

                {/* Section 4 */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold m-0">4. User Conduct</h2>
                    </div>
                    <p>You agree not to use the Service to:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li>Upload or distribute content that is illegal, defamatory, harassing, or hate speech.</li>
                        <li>Spam other users or post unauthorized advertising.</li>
                        <li>Attempt to interfere with the proper working of the Service or compromise its security.</li>
                        <li>Impersonate any person or entity.</li>
                    </ul>
                </section>

                {/* Section 5 */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">5. Courses & Educational Content</h2>
                    <p>
                        Pathchakro may offer courses and assignments. We do not guarantee specific educational outcomes. Users creating courses must ensure accuracy and appropriateness of content.
                    </p>
                </section>

                {/* Section 6 */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
                    <p>
                        Pathchakro is provided on an "as is" and "as available" basis. We are not liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
                    </p>
                </section>

                {/* Contact Section */}
                <div className="bg-muted p-6 rounded-lg border text-center mt-12">
                    <h3 className="text-xl font-semibold mb-2">Questions?</h3>
                    <p className="text-muted-foreground mb-4">
                        If you have any questions about these Terms, please contact us using the link below.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-12 pb-8">
                &copy; {new Date().getFullYear()} Pathchakro. All rights reserved.
            </div>
        </div>
    );
}