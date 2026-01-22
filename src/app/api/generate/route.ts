import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";

// Configure OpenRouter as the OpenAI provider
const openai = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

export const runtime = "edge";

const MODELS = [
    "google/gemini-2.0-flash-exp:free",      // Primary: Smartest free model
    "meta-llama/llama-3.3-70b-instruct:free", // Backup: High performance
    "google/gemini-flash-1.5-8b"              // Backup: Fast
];

export async function POST(req: NextRequest) {
    // Parse the request body
    const { prompt } = await req.json();

    for (const modelId of MODELS) {
        try {
            // Generate text using one of the free models
            const response = await streamText({
                model: openai(modelId),
                prompt: prompt,
                temperature: 0.7,
            });

            // Return the stream
            return response.toTextStreamResponse();
        } catch (error) {
            console.error(`AI Generation Error with model ${modelId}:`, error);
            // If this was the last model, return an error
            if (modelId === MODELS[MODELS.length - 1]) {
                return NextResponse.json(
                    { error: "Failed to generate text with all available models. Check your API key and credits." },
                    { status: 500 }
                );
            }
            // Otherwise, fall back to the next model in the list
            console.log(`Falling back to the next available model...`);
        }
    }

    return NextResponse.json(
        { error: "Failed to generate text." },
        { status: 500 }
    );
}
