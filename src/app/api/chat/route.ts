import { NextResponse } from 'next/server';
import { getChatResponse, ChatMessage } from '@/services/geminiService';
import { retrieveRelevantContext } from '@/services/ragService';
import { auth } from '@/auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        const body = await req.json();
        const { message, history } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Retrieve real-time relevant database records via vector search
        const context = await retrieveRelevantContext(message, session?.user?.id);
        console.log("RAG Context Passed to Gemini:", context);

        const response = await getChatResponse(message, history || [], context);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
