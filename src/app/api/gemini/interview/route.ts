import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyAttsNk7ExqMPfTKwzZK7UImfWW9sbEHpM");

// System prompt for the interviewer persona
const INTERVIEWER_SYSTEM_PROMPT = `You are an intelligent, articulate interviewer. Your job is to ask thoughtful, relevant follow-up questions. Keep the conversation engaging and on-topic. Speak clearly and concisely. Always wait for the user's reply before continuing. Assume the user is preparing for job or media interviews, and tailor your tone to be friendly but professional.

Important guidelines:
- Ask one question at a time
- Keep responses under 3 sentences
- Listen actively and ask follow-up questions based on what the user says
- Be encouraging and professional
- Help the user practice articulating their thoughts clearly
- If the user seems stuck, offer gentle prompts or rephrase the question`;

interface ConversationMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export async function POST(request: NextRequest) {
  try {
    // API key is now hardcoded above
    // if (!process.env.GEMINI_API_KEY) {
    //   return NextResponse.json(
    //     { error: "Gemini API key not configured. Please set GEMINI_API_KEY in environment variables." },
    //     { status: 500 }
    //   );
    // }

    // Parse request body
    const body = await request.json();
    const { userInput, conversationHistory, customSystemPrompt } = body;

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput is required and must be a string' },
        { status: 400 }
      );
    }

    // Use custom system prompt if provided, otherwise use default
    const systemPrompt = customSystemPrompt || INTERVIEWER_SYSTEM_PROMPT;

    // Get the Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: systemPrompt
    });

    // Build conversation history
    const history: ConversationMessage[] = conversationHistory || [];

    // Start a chat session with history
    const chat = model.startChat({
      history: history,
    });

    // Send the user's message
    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    const responseText = response.text();

    // Return the response along with updated history
    return NextResponse.json({
      response: responseText,
      conversationHistory: [
        ...history,
        {
          role: 'user',
          parts: [{ text: userInput }]
        },
        {
          role: 'model',
          parts: [{ text: responseText }]
        }
      ]
    });

  } catch (error: any) {
    console.error("Gemini API error:", error);
    
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable." },
        { status: 401 }
      );
    } else if (error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate interviewer response", details: error.message },
      { status: 500 }
    );
  }
}
