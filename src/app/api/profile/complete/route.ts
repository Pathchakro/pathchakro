import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { bio, bloodGroup, bookPreferences } = body;

        await dbConnect();

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            {
                bio: bio || '',
                bloodGroup: bloodGroup || '',
                bookPreferences: bookPreferences || [],
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    bio: updatedUser.bio,
                    bloodGroup: updatedUser.bloodGroup,
                    bookPreferences: updatedUser.bookPreferences,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Profile completion error:', error);
        return NextResponse.json(
            { error: 'An error occurred while updating profile' },
            { status: 500 }
        );
    }
}
