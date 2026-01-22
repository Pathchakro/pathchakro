import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const file = await req.blob();
        const formData = new FormData();
        formData.append('image', file);

        const imgbbApiKey = process.env.IMGBB_API_KEY;

        if (!imgbbApiKey) {
            return NextResponse.json(
                { error: 'IMGBB_API_KEY not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const data = await response.json();

        if (data.success) {
            return NextResponse.json({ url: data.data.url });
        } else {
            return NextResponse.json(
                { error: 'Upload failed' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}
