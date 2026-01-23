import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import FundApplication from '@/models/FundApplication';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login to apply.' },
                { status: 401 }
            );
        }

        await dbConnect();

        const data = await req.json();
        const { title, description, amount } = data;

        if (!title || !description || !amount) {
            return NextResponse.json(
                { error: 'Title, description (rich text), and amount are required.' },
                { status: 400 }
            );
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount.' },
                { status: 400 }
            );
        }

        // Ideally, we should parse 'description' to ensure it's valid JSON for Novel/Tiptap,
        // but for now we trust the client sends an object/string that the Editor can read back.
        // If 'description' comes as a stringified JSON, we might want to store it as object or string.
        // The model expects 'Mixed' (object), so if it comes as string, we try to parse it.

        let descContent = description;
        if (typeof description === 'string') {
            try {
                descContent = JSON.parse(description);
            } catch (e) {
                // If it's not JSON, it might be plain text? Novel editor sends JSON string usually.
                // We'll proceed with it as is if it fails parsing, but it might break the editor view later.
            }
        }

        const application = await FundApplication.create({
            applicant: session.user.id,
            title,
            description: descContent,
            amountRequested: numericAmount,
            status: 'pending',
        });

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully.',
            applicationId: application._id
        });

    } catch (error) {
        console.error('Fund Application Error:', error);
        return NextResponse.json(
            { error: 'Failed to submit application' },
            { status: 500 }
        );
    }
}
