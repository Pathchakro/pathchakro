import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import BookPDF from '@/models/BookPDF';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const { slug } = params;
        const book = await Book.findOne({
            $or: [
                { slug: slug },
                ...(/^[0-9a-fA-F]{24}$/.test(slug) ? [{ _id: slug }] : [])
            ]
        });

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        const pdfs = await BookPDF.find({ book: book._id })
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
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
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

        const { slug } = params;
        const book = await Book.findOne({
            $or: [
                { slug: slug },
                ...(/^[0-9a-fA-F]{24}$/.test(slug) ? [{ _id: slug }] : [])
            ]
        });

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        const pdf = await BookPDF.create({
            book: book._id,
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
