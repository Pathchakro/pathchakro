import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { syncUserTeams } from '@/lib/team-sync';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, profileType, university, thana } = body;

        // Validate required fields
        if (!name || !email || !password || !thana) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            profileType: profileType || 'Regular',
            university: university || '',
            thana,
            isEmailVerified: false,
        });

        // Auto-sync teams based on registration data
        try {
            await syncUserTeams(user._id.toString());
        } catch (syncError) {
            console.error('Error syncing teams during registration:', syncError);
            // Don't fail registration if sync fails
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user.toObject();

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: userWithoutPassword,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}
