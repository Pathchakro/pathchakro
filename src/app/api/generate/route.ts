import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";

// Configure OpenRouter as the OpenAI provider
const openai = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
    // Parse the request body
    // Novel (and Vercel AI SDK useCompletion) typically sends { prompt: string }
    const { prompt } = await req.json();

    try {
        // Generate text using a model available on OpenRouter
        // We use 'openai/gpt-4o-mini' as a cost-effective default, or fallback to others.
        // Ensure the model ID matches OpenRouter's expected format.
        const response = await streamText({
            model: openai("openai/gpt-4o-mini"),
            prompt: prompt,
            temperature: 0.7,
            maxTokens: 500,
        });

        // Return the stream
        return response.toDataStreamResponse();
    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json(
            { error: "Failed to generate text. Check your API key and credits." },
            { status: 500 }
        );
    }
}
