import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { chatSchema, validateBody } from '@/lib/validation';

/* ------------------------------------------------------------------ */
/*  Curated fallback responses (no API key needed)                     */
/* ------------------------------------------------------------------ */

const FALLBACK_RESPONSES: Record<string, string> = {
  hello:
    "Hi there! I'm Vivi, your speech buddy! 🦜 I can help with speech tips, answer questions about sounds, or just chat. What would you like to know?",
  speech:
    "Speech development is amazing! Most children develop their sounds in a predictable order. Early sounds like /p/, /b/, and /m/ come first, and trickier sounds like /r/ and /th/ come later. Every child develops at their own pace! 🌱",
  sounds:
    "There are lots of fun ways to practice sounds! Try playing Sound Safari to practice individual sounds, or Rhythm River to work on sentence flow. The key is making it feel like play, not work! 🎮",
  help:
    "I'm here to help! You can ask me about: 🔹 Speech sounds and how to make them 🔹 Tips for practicing at home 🔹 What's normal for your child's age 🔹 How to use BoloBridge's games. What would you like to know?",
  practice:
    "Great question about practice! Here are some tips: 🌟 Keep sessions short (5-10 minutes) 🌟 Make it fun with games! 🌟 Praise effort, not perfection 🌟 Practice during daily activities like bath time or meal time 🌟 Be patient, progress takes time!",
  worried:
    "It's completely natural to have concerns about your child's speech. Remember, every child develops at their own pace. If you're worried, our screening tool can help you identify areas to focus on. For clinical concerns, consulting a speech-language pathologist is always a good step. 💛",
  age:
    "Speech milestones vary by age! By age 2, children typically say /p/, /b/, /m/. By 3-4, they add /k/, /g/, /f/. By 5-6, trickier sounds like /l/, /r/, /sh/ develop. By 7, most sounds should be clear. Our screening tool can check your child's progress! 📊",
  screening:
    "Our speech screening tests your child on age-appropriate sounds based on ASHA guidelines. It takes about 5-10 minutes and gives you a risk report with color-coded results. It's not a diagnosis, just a helpful guide! You can find it in the Screening section. 🩺",
  games:
    "BoloBridge has 6 games! 🦁 Sound Safari: practice individual sounds with animals 🌻 Word Garden: learn vocabulary and practice words 💪 Tongue Gym: exercises for mouth muscles 🌊 Rhythm River: practice sentence flow and rhythm 🎭 Story Studio: conversational role-play 🎵 Emotion Echo: prosody and emotion recognition",
};

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  for (const [key, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }

  const genericResponses = [
    "Great question! Did you know that reading aloud together is one of the best ways to support speech development? Try our Story Studio for an AI-powered storytelling experience! 🎭",
    "I love your curiosity! Speech is like a superpower that grows stronger with practice. Our games turn practice into play, so your child builds skills without even realizing it! 🌟",
    "That's something many parents wonder about! Every child's speech journey is unique. Try our free Screening tool to get a quick snapshot of where your child is right now. 🩺",
    "Fun fact: children learn speech best through play and conversation! BoloBridge's Story Studio uses AI to create personalized role-play scenarios that naturally encourage speech practice. 🎪",
    "Such a thoughtful question! For hands-on practice, I'd recommend starting with Sound Safari for individual sounds, or Rhythm River for building sentence fluency. Both are super fun! 🦁",
    "I'm glad you're thinking about this! Consistency matters more than perfection. Even 5 minutes of daily practice through our games can make a real difference over time. 💪",
    "Great to hear from you! Did you know our AI screening can assess which sounds your child has mastered and which ones need more practice? It takes just a few minutes! 📊",
    "That's a wonderful thing to explore! The best part about BoloBridge is that all our activities are based on real speech therapy research, just wrapped in a fun, game-like experience. 🌻",
  ];

  const idx = (message.length + new Date().getHours()) % genericResponses.length;
  return genericResponses[idx];
}

/* ------------------------------------------------------------------ */
/*  API Route Handler                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const limit = rateLimit(req, { maxRequests: 20, windowMs: 60_000, prefix: 'chat' });
  if (!limit.ok) return limit.response;

  let message = '';

  try {
    const rawBody = await req.json();

    // Validate input
    const parsed = validateBody(chatSchema, rawBody);
    if (!parsed.ok) return parsed.response;

    const { message: validatedMessage, history } = parsed.data;
    message = validatedMessage;

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, use fallback responses
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        response: getFallbackResponse(message),
        source: 'fallback',
      });
    }

    // Use Gemini API
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `You are Vivi, a friendly parrot mascot for BoloBridge, a speech wellness platform for children ages 3-12.

Your personality:
- Warm, encouraging, and patient
- Use simple language that parents can understand
- Include relevant emojis sparingly (1-3 per response)
- Keep responses concise (2-4 sentences typically)
- Never diagnose or provide clinical advice
- Always recommend consulting a speech-language pathologist for clinical concerns
- You can explain speech sounds, give practice tips, and encourage families
- Reference BoloBridge features when relevant (games, screening, learning modules)

Important guidelines:
- This is a wellness/educational tool, NOT a medical device
- Never claim to diagnose speech disorders
- Encourage professional consultation when concerns arise
- Focus on positive reinforcement and fun
- Be age-appropriate and child-safe in all responses`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
    });

    const geminiHistory = history.map(
      (h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })
    );

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text() || getFallbackResponse(message);

    return NextResponse.json({
      response: responseText,
      source: 'gemini',
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json({
      response: getFallbackResponse(message || ''),
      source: 'fallback',
    });
  }
}
