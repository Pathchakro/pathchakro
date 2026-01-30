import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        let team;

        // Check if the slug param is a valid ObjectId
        if (mongoose.isValidObjectId(params.slug)) {
            team = await Team.findById(params.slug)
                .populate('leader', 'name image rankTier')
                .populate('members.user', 'name image rankTier')
                .lean();
        }

        // If not found by ID (or not an ID), try finding by slug
        if (!team) {
            team = await Team.findOne({ slug: params.slug })
                .populate('leader', 'name image rankTier')
                .populate('members.user', 'name image rankTier')
                .lean();
        }

        if (!team) {
            return NextResponse.json(
                { error: 'Team not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ team });
    } catch (error: any) {
        console.error('Error fetching team:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team' },
            { status: 500 }
        );
    }
}
