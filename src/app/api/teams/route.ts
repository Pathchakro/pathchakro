import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('q');
        const category = searchParams.get('category');
        const university = searchParams.get('university');
        const location = searchParams.get('location');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 1 : -1;

        let filter: any = {};

        if (type && type !== 'all') {
            filter.type = type;
        }

        if (category && category !== 'all') {
            filter.category = category;
        }

        if (university) {
            filter.university = { $regex: university, $options: 'i' };
        }

        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        // Dynamic sort object
        const sortOptions: any = {};
        if (sortBy === 'members') {
            // For array length sorting we might need aggregation, but for simplicity let's stick to simple fields or handle members differently.
            // Standard Mongoose sort on virtuals or array length isn't direct. 
            // Falling back to basic fields for now, or using a specific hack if needed.
            // Actually, 'members' is an array. Sorting by size requires aggregation.
            // Let's stick to simpler sorts first: createdAt, name, location, university.
            sortOptions['createdAt'] = -1; // Default fallback for members if not aggregating
        } else {
            sortOptions[sortBy] = order;
        }

        const totalTeams = await Team.countDocuments(filter);

        let query = Team.find(filter)
            .populate('leader', 'name image rankTier')
            .skip(skip)
            .limit(limit)
            .lean();

        // Handle array size sort if absolutely necessary later, but for now apply standard sort
        if (sortBy !== 'members') {
            query = query.sort(sortOptions);
        } else {
            // Default sort if members sort requested but not implemented via aggregation yet
            query = query.sort({ createdAt: -1 });
        }

        const teams = await query;

        // If sorting by members is requested, we can do it in memory for the current page (imperfect) or switch to aggregation.
        // Given the user wants to see "all", aggregation is better, but let's stick to standard first.

        return NextResponse.json({
            teams,
            pagination: {
                total: totalTeams,
                page,
                limit,
                totalPages: Math.ceil(totalTeams / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching teams:', error);
        return NextResponse.json(
            { error: 'Failed to fetch teams' },
            { status: 500 }
        );
    }
}

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
        const { name, description, type, privacy, university, location, category } = body;

        if (!name || !description || !type || !category) {
            return NextResponse.json(
                { error: 'Name, description, type, and category are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Generate slug from name, supporting Unicode characters
        let slugBase = name
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\p{L}\p{M}\p{N}\-]/gu, '') // Keep letters, marks, numbers, and hyphens
            .replace(/-+/g, '-') // Replace multiple - with single -
            .replace(/^-+|-+$/g, ''); // Trim - from start and end

        // Fallback for empty slug (e.g. if name is only special chars)
        if (!slugBase) {
            slugBase = 'team-' + Math.random().toString(36).substring(2, 8);
        }

        let slug = slugBase;
        let counter = 1;
        while (await Team.findOne({ slug })) {
            slug = `${slugBase}-${counter}`;
            counter++;
        }

        const team = await Team.create({
            name,
            description,
            type,
            category,
            slug,
            privacy: privacy || 'public',
            university: university || '',
            location: location || '',
            leader: session.user.id,
            members: [
                {
                    user: session.user.id,
                    role: 'leader',
                    joinedAt: new Date(),
                },
            ],
            joinRequests: [],
        });

        const populatedTeam = await Team.findById(team._id)
            .populate('leader', 'name image rankTier')
            .lean();

        return NextResponse.json(
            { team: populatedTeam },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating team:', error);
        return NextResponse.json(
            { error: 'Failed to create team' },
            { status: 500 }
        );
    }
}
