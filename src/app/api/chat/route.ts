import { NextResponse } from 'next/server';
import { getChatResponse, ChatMessage } from '@/services/geminiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, history } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const response = await getChatResponse(message, history || []);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
