import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Only image files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (max 32MB for ImgBB)
        if (file.size > 32 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 32MB' },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');

        // Upload to ImgBB
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', base64);

        const imgbbResponse = await fetch(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            {
                method: 'POST',
                body: imgbbFormData,
            }
        );

        const imgbbData = await imgbbResponse.json();

        if (!imgbbData.success) {
            throw new Error(imgbbData.error?.message || 'Upload failed');
        }

        return NextResponse.json({
            url: imgbbData.data.url,
            displayUrl: imgbbData.data.display_url,
            thumbUrl: imgbbData.data.thumb.url,
            deleteUrl: imgbbData.data.delete_url,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload image' },
            { status: 500 }
        );
    }
}
