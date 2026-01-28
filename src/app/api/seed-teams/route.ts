import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Institute from '@/models/Institute';
import Location from '@/models/Location';
import Category from '@/models/Category';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // 1. Get a default leader (first user found)
        const defaultLeader = await User.findOne({});
        if (!defaultLeader) {
            return NextResponse.json({ error: 'No users found to assign as leader. Please create a user first.' }, { status: 400 });
        }

        let createdCount = 0;
        const errors = [];

        // 2. Seed from Institutes
        const institutes = await Institute.find({});
        for (const inst of institutes) {
            try {
                const exists = await Team.findOne({ name: inst.name, type: 'University' });
                if (!exists) {
                    await Team.create({
                        name: inst.name,
                        description: `Official community for ${inst.name}`,
                        type: 'University',
                        university: inst.name,
                        leader: defaultLeader._id,
                        members: [{ user: defaultLeader._id, role: 'leader' }],
                        privacy: 'public'
                    });
                    createdCount++;
                }
            } catch (err: any) {
                errors.push(`Failed to create team for institute ${inst.name}: ${err.message}`);
            }
        }

        // 3. Seed from Locations (Thanas)
        const locations = await Location.find({});
        for (const loc of locations) {
            if (loc.districts && Array.isArray(loc.districts)) {
                for (const district of loc.districts) {
                    if (district.thanas && Array.isArray(district.thanas)) {
                        for (const thana of district.thanas) {
                            try {
                                const teamName = `${thana}, ${district.name}`;
                                const exists = await Team.findOne({ name: teamName, type: 'Thana' });
                                if (!exists) {
                                    await Team.create({
                                        name: teamName,
                                        description: `Community for residents of ${thana}, ${district.name}`,
                                        type: 'Thana',
                                        location: teamName,
                                        leader: defaultLeader._id,
                                        members: [{ user: defaultLeader._id, role: 'leader' }],
                                        privacy: 'public'
                                    });
                                    createdCount++;
                                }
                            } catch (err: any) {
                                errors.push(`Failed to create team for thana ${thana}: ${err.message}`);
                            }
                        }
                    }
                }
            }
        }

        // 4. Seed from Categories
        const categories = await Category.find({});
        for (const cat of categories) {
            try {
                const exists = await Team.findOne({ name: cat.name, type: 'Special' });
                if (!exists) {
                    await Team.create({
                        name: cat.name,
                        description: `Special interest group for ${cat.name}`,
                        type: 'Special',
                        category: cat.name,
                        leader: defaultLeader._id,
                        members: [{ user: defaultLeader._id, role: 'leader' }],
                        privacy: 'public'
                    });
                    createdCount++;
                }
            } catch (err: any) {
                errors.push(`Failed to create team for category ${cat.name}: ${err.message}`);
            }
        }

        return NextResponse.json({
            message: 'Seeding completed',
            created: createdCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
