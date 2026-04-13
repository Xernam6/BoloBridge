import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { storyStudioSchema, validateBody } from '@/lib/validation';

/* ------------------------------------------------------------------ */
/*  Scripted fallback conversations (no API key needed)                */
/* ------------------------------------------------------------------ */

const SCRIPTED_SCENARIOS: Record<
  string,
  { opener: string; responses: string[] }
> = {
  restaurant: {
    opener:
      "Welcome to Sunny's Restaurant! I'm your waiter today. What would you like to eat?",
    responses: [
      "That sounds delicious! Would you like something to drink with that?",
      "Great choice! And would you like any dessert after your meal?",
      "Your food will be ready very soon! Would you like to color while you wait?",
      "Here comes your food! It looks so yummy. Enjoy your meal!",
      "I hope you liked everything! Come back and visit us again soon!",
    ],
  },
  park: {
    opener:
      "Hi there! I'm playing at the park today. Do you want to play with me?",
    responses: [
      "That sounds like so much fun! What should we play first?",
      "Wow, you're really good at that! Can you show me how you did it?",
      "Look at that bird over there! What kind of bird do you think it is?",
      "I'm getting a little tired. Should we sit on the bench and rest?",
      "This was the best day at the park ever! Let's play again tomorrow!",
    ],
  },
  school: {
    opener:
      "Good morning, class! I'm your teacher today. Are you ready to learn something fun?",
    responses: [
      "That's a wonderful answer! You're so smart. Can you tell me more?",
      "Let's count together! Can you count to ten with me?",
      "Now it's art time! What would you like to draw today?",
      "Time for show and tell! What did you bring to share with the class?",
      "Great job today! You learned so many new things. See you tomorrow!",
    ],
  },
  'space-adventure': {
    opener:
      "Mission control to astronaut! We're launching into space in 3... 2... 1... blast off! What do you see out the window?",
    responses: [
      "Wow, look at all those stars! Can you count how many you see?",
      "I think I see a planet! What color is it? Should we fly closer?",
      "Oh no, a friendly alien is waving at us! What should we say to them?",
      "The alien wants to trade snacks! What Earth food should we share?",
      "Time to head back home. That was an amazing space adventure!",
    ],
  },
};

function getScriptedResponse(
  scenario: string,
  exchangeCount: number,
): string {
  const data = SCRIPTED_SCENARIOS[scenario] || SCRIPTED_SCENARIOS.restaurant;
  const idx = Math.min(exchangeCount, data.responses.length - 1);
  return data.responses[idx];
}

function getScriptedOpener(scenario: string): string {
  return (
    SCRIPTED_SCENARIOS[scenario]?.opener ??
    SCRIPTED_SCENARIOS.restaurant.opener
  );
}

/* ------------------------------------------------------------------ */
/*  API Route Handler                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Rate limit: 30 requests per minute per IP (conversational, higher limit)
  const limit = rateLimit(req, { maxRequests: 30, windowMs: 60_000, prefix: 'story-studio' });
  if (!limit.ok) return limit.response;

  try {
    const rawBody = await req.json();

    // Validate input
    const parsed = validateBody(storyStudioSchema, rawBody);
    if (!parsed.ok) return parsed.response;

    const { scenario, childSpeech, conversationHistory, childAge, getOpener } = parsed.data;

    // Return opener for scenario start
    if (getOpener) {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return NextResponse.json({
          response: getScriptedOpener(scenario),
          source: 'fallback',
        });
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: buildSystemPrompt(scenario, childAge),
      });

      const result = await model.generateContent(
        'Start the conversation. Give your opening line in character.'
      );
      return NextResponse.json({
        response: result.response.text() || getScriptedOpener(scenario),
        source: 'gemini',
      });
    }

    // Regular conversation turn
    if (!childSpeech) {
      return NextResponse.json(
        { error: 'childSpeech is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const exchangeCount = conversationHistory.filter(
      (m) => m.role === 'character',
    ).length;

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return NextResponse.json({
        response: getScriptedResponse(scenario, exchangeCount),
        source: 'fallback',
      });
    }

    // Use Gemini API with recasting system prompt
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: buildSystemPrompt(scenario, childAge),
    });

    const geminiHistory = conversationHistory.map((m) => ({
      role: m.role === 'child' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(childSpeech);

    return NextResponse.json({
      response: result.response.text() || getScriptedResponse(scenario, exchangeCount),
      source: 'gemini',
    });
  } catch (error) {
    console.error('Story Studio API error:', error);
    return NextResponse.json({
      response: getScriptedResponse('restaurant', 0),
      source: 'fallback',
    });
  }
}

/* ------------------------------------------------------------------ */
/*  System prompt builder                                              */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(scenario: string, childAge: number = 5): string {
  const scenarioDescriptions: Record<string, string> = {
    restaurant: 'a friendly waiter at a kid-friendly restaurant',
    park: 'a new friend at the playground',
    school: 'a fun, encouraging teacher in a classroom',
    'space-adventure': 'a fellow astronaut on a space mission',
  };

  const character =
    scenarioDescriptions[scenario] ?? scenarioDescriptions.restaurant;

  return `You are ${character}, having a conversation with a child aged ${childAge}.

CRITICAL TECHNIQUE - RECASTING:
When the child makes a speech error or uses incorrect grammar, naturally incorporate the corrected form in your response. Do NOT directly correct them or say "you mean..." — instead, RECAST by using the correct form naturally:
- Child: "I want the pasketti" → You: "Oh, you want the spaghetti! Great choice!"
- Child: "Him goed to store" → You: "He went to the store? That sounds fun!"
- Child: "Me want dat" → You: "You want that one? Let me get it for you!"

Target rate: about 1 recast per response when errors are detected.

Rules:
- Keep responses to 1-2 SHORT sentences (appropriate for age ${childAge})
- Use simple vocabulary the child can understand
- Stay in character as ${character} at all times
- Be warm, encouraging, playful, and enthusiastic
- Ask questions to keep the conversation going
- If you cannot detect any speech errors, just continue naturally
- Never break character or mention you are an AI
- Never use clinical language or mention "speech therapy"
- Make the scenario fun and imaginative`;
}
