import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import { generateUniqueSlug } from '@/lib/slug-utils';

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

        const filterMode = searchParams.get('filter');
        if (filterMode === 'mine') {
            const session = await auth();
            if (session?.user?.id) {
                filter['members.user'] = session.user.id;
            }
        }

        if (category && category !== 'all') {
            filter.category = category;
        }

        /**
         * Helper to escape regex special characters
         */
        const escapeRegex = (str: string) => str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

        if (university) {
            filter.university = { $regex: escapeRegex(university), $options: 'i' };
        }

        if (location) {
            filter.location = { $regex: escapeRegex(location), $options: 'i' };
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { description: { $regex: escapedSearch, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        // Dynamic sort object
        const sortOptions: any = {};
        if (sortBy === 'members') {
            sortOptions['createdAt'] = -1;
        } else {
            sortOptions[sortBy] = order;
        }

        const totalTeams = await Team.countDocuments(filter);

        let query = Team.find(filter)
            .populate('leader', 'name image rankTier')
            .skip(skip)
            .limit(limit)
            .lean();

        if (sortBy !== 'members') {
            query = query.sort(sortOptions);
        } else {
            query = query.sort({ createdAt: -1 });
        }

        const teams = await query;

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
        const { name, description, type, privacy, university, location, category, slug: customSlug } = body;

        if (!name || !description || !type || !category) {
            return NextResponse.json(
                { error: 'Name, description, type, and category are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Robust customSlug validation and sanitization
        let normalizedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens, no consecutive hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile', 'teams', 'posts', 'courses'].includes(trimmed);
            const hasPathTraversal = trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\');
            
            if (trimmed.length >= 3 && trimmed.length <= 63 && isValidPattern && !isReserved && !hasPathTraversal) {
                normalizedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 3-63 characters, lowercase letters, numbers, and single hyphens. No reserved words or path separators.' },
                    { status: 400 }
                );
            }
        }

        // Generate slug from the validated customSlug or fallback to name
        const slug = await generateUniqueSlug(Team, normalizedSlug || name);

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
