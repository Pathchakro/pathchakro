import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { status, personalRating, personalNotes } = await request.json();

        await dbConnect();

        const libraryItem = await UserLibrary.findOne({
            _id: params.id,
            user: session.user.id,
        });

        if (!libraryItem) {
            return NextResponse.json(
                { error: 'Library item not found' },
                { status: 404 }
            );
        }

        if (status) {
            libraryItem.status = status;

            if (status === 'reading' && !libraryItem.startedReading) {
                libraryItem.startedReading = new Date();
            }

            if (status === 'completed' && !libraryItem.completedReading) {
                libraryItem.completedReading = new Date();
            }
        }

        if (personalRating !== undefined) {
            libraryItem.personalRating = personalRating;
        }

        if (personalNotes !== undefined) {
            libraryItem.personalNotes = personalNotes;
        }

        await libraryItem.save();

        return NextResponse.json({
            library: libraryItem,
            message: 'Library item updated',
        });
    } catch (error: any) {
        console.error('Error updating library item:', error);
        return NextResponse.json(
            { error: 'Failed to update library item' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const result = await UserLibrary.findOneAndDelete({
            _id: params.id,
            user: session.user.id,
        });

        if (!result) {
            return NextResponse.json(
                { error: 'Library item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Book removed from library',
        });
    } catch (error: any) {
        console.error('Error removing from library:', error);
        return NextResponse.json(
            { error: 'Failed to remove book from library' },
            { status: 500 }
        );
    }
}
