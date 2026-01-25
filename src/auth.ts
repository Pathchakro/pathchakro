import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                await dbConnect();

                const user = await User.findOne({ email: credentials.email }).select('+password');

                if (!user || !user.password) {
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                await dbConnect();

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    await User.create({
                        name: user.name as string,
                        email: user.email as string,
                        image: user.image as string,
                        isEmailVerified: true,
                    });
                }
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                await dbConnect();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;

                await dbConnect();
                const dbUser = await User.findById(token.id);

                if (dbUser) {
                    session.user.name = dbUser.name;
                    session.user.email = dbUser.email;
                    session.user.image = dbUser.image;
                    // Add custom fields
                    (session.user as any).profileType = dbUser.profileType;
                    (session.user as any).rank = dbUser.rank;
                    (session.user as any).rankTier = dbUser.rankTier;
                    (session.user as any).role = dbUser.role;
                    (session.user as any).profileCompletion = dbUser.profileCompletion;
                    (session.user as any).isVerified = dbUser.verification?.isVerified || false;
                    (session.user as any).followers = dbUser.followers;
                    (session.user as any).following = dbUser.following;
                }
            }

            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
});
