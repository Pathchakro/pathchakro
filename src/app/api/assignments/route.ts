import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import User from '@/models/User';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');
        const role = searchParams.get('role'); // 'teacher' or 'student'

        let filter: any = { status: { $in: ['published', 'closed'] } };

        if (role === 'teacher') {
            filter = { teacher: session.user.id };
        } else if (teamId) {
            filter.team = teamId;
        }

        const assignments = await Assignment.find(filter)
            .populate('teacher', 'name image rankTier')
            .populate('team', 'name')
            .populate('submissions.student', 'name image')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ assignments });
    } catch (error: any) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assignments' },
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
        const { title, description, dueDate, totalPoints, teamId, attachments, slug: customSlug } = body;

        if (!title || !description || !dueDate || !totalPoints) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Robust customSlug validation and sanitization
        let validatedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens, no consecutive hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            
            if (trimmed.length >= 1 && trimmed.length <= 100 && isValidPattern) {
                validatedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 1-100 characters, lowercase letters, numbers, and hyphens.' },
                    { status: 400 }
                );
            }
        }

        const slug = await generateUniqueSlug(Assignment, validatedSlug || title);

        const assignment = await Assignment.create({
            teacher: session.user.id,
            team: teamId || undefined,
            title,
            slug,
            description,
            dueDate: new Date(dueDate),
            totalPoints,
            attachments: attachments || [],
            status: 'published',
            submissions: [],
        });

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('teacher', 'name image rankTier')
            .populate('team', 'name')
            .lean();

        revalidatePath('/', 'layout');

        return NextResponse.json(
            { assignment: populatedAssignment },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating assignment:', error);
        return NextResponse.json(
            { error: 'Failed to create assignment' },
            { status: 500 }
        );
    }
}
