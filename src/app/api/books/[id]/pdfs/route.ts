import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BookPDF from '@/models/BookPDF';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        const pdfs = await BookPDF.find({ book: params.id })
            .populate('uploadedBy', 'name image')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ pdfs });
    } catch (error: any) {
        console.error('Error fetching PDFs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch PDFs' },
            { status: 500 }
        );
    }
}

export async function POST(
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

        const { fileName, fileUrl, fileSize, description } = await request.json();

        if (!fileName || !fileUrl || !fileSize) {
            return NextResponse.json(
                { error: 'File name, URL, and size are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const pdf = await BookPDF.create({
            book: params.id,
            uploadedBy: session.user.id,
            fileName,
            fileUrl,
            fileSize,
            description,
            downloads: 0,
        });

        const populatedPDF = await BookPDF.findById(pdf._id)
            .populate('uploadedBy', 'name image')
            .lean();

        return NextResponse.json(
            { pdf: populatedPDF, message: 'PDF uploaded successfully' },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error uploading PDF:', error);
        return NextResponse.json(
            { error: 'Failed to upload PDF' },
            { status: 500 }
        );
    }
}
