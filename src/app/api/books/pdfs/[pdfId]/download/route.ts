import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BookPDF from '@/models/BookPDF';

export async function PUT(
    request: NextRequest,
    { params }: { params: { pdfId: string } }
) {
    try {
        await dbConnect();

        const pdf = await BookPDF.findByIdAndUpdate(
            params.pdfId,
            { $inc: { downloads: 1 } },
            { new: true }
        );

        if (!pdf) {
            return NextResponse.json(
                { error: 'PDF not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Download count updated',
            downloads: pdf.downloads,
        });
    } catch (error: any) {
        console.error('Error tracking download:', error);
        return NextResponse.json(
            { error: 'Failed to track download' },
            { status: 500 }
        );
    }
}
