import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { chatSchema, validateBody } from '@/lib/validation';

/* ------------------------------------------------------------------ */
/*  Curated fallback responses (no API key needed)                     */
/* ------------------------------------------------------------------ */

const FALLBACK_RESPONSES: Record<string, string> = {
  hello:
    "Hi there! I'm Vivi, your speech buddy. I can help with speech tips, answer questions about sounds, or just chat. What would you like to know?",
  speech:
    "Speech development is fascinating. Most children develop their sounds in a predictable order. Early sounds like /p/, /b/, and /m/ come first, and trickier sounds like /r/ and /th/ come later. Every child develops at their own pace.",
  sounds:
    "There are lots of ways to practice sounds. Try playing Sound Safari to practice individual sounds, or Rhythm River to work on sentence flow. The key is making it feel like play, not work.",
  help:
    "I'm here to help. You can ask me about speech sounds and how to make them, tips for practicing at home, what's normal for your child's age, or how to use BoloBridge's games. What would you like to know?",
  practice:
    "Great question about practice. Keep sessions short (5-10 minutes), make it fun with games, praise effort not perfection, and practice during daily activities like bath time or meal time. Consistency matters more than duration.",
  worried:
    "It's completely natural to have concerns about your child's speech. Every child develops at their own pace. Our screening tool can help identify areas to focus on. For clinical concerns, consulting a speech-language pathologist is always a good step.",
  age:
    "Speech milestones vary by age. By age 2, children typically say /p/, /b/, /m/. By 3-4, they add /k/, /g/, /f/. By 5-6, trickier sounds like /l/, /r/, /sh/ develop. By 7, most sounds should be clear. Our screening tool can check your child's progress.",
  screening:
    "Our speech screening tests your child on age-appropriate sounds based on ASHA guidelines. It takes about 5-10 minutes and gives you a risk report with color-coded results. It's not a diagnosis, just a helpful guide. You can find it in the Screening section.",
  games:
    "BoloBridge has 7 activities. Sound Safari practices individual sounds with animals. Word Garden builds vocabulary. Tongue Gym exercises mouth muscles. Rhythm River works on sentence flow. Story Studio is conversational role-play. Emotion Echo trains prosody. Reader builds oral reading fluency.",
};

const recentGenericIndices: number[] = [];

function getFallbackResponse(message: string, history: { role: string; content: string }[] = []): string {
  const lower = message.toLowerCase();
  const context = [lower, ...history.slice(-2).map((h) => h.content.toLowerCase())].join(' ');

  for (const [key, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (context.includes(key)) return response;
  }

  const genericResponses = [
    "Reading aloud together daily is one of the most effective ways to support speech development. BoloBridge's Story Studio makes this interactive with structured role-play scenarios.",
    "Speech grows stronger with consistent practice. BoloBridge's games are designed so children build skills through play rather than drills — short daily sessions work better than long infrequent ones.",
    "Every child's speech journey is different. Our free Screening tool gives you a quick snapshot of where your child stands based on ASHA developmental norms.",
    "Children learn speech best through conversation and play. Story Studio uses structured role-play to naturally model correct speech forms without direct correction.",
    "For individual sound practice, Sound Safari is a great starting point. For sentence fluency, try Rhythm River. Both adapt to your child's level.",
    "Consistency matters more than perfection. Even 5 minutes of daily practice through BoloBridge's games can make a meaningful difference over time.",
    "Our screening can identify which sounds your child has mastered and which need more attention. It takes under 10 minutes and generates a color-coded risk report.",
    "All BoloBridge activities are grounded in speech therapy research — ASHA developmental norms, the Cycles Approach, and evidence-based oral reading fluency techniques.",
    "If you're concerned about your child's speech, the first step is completing a screening. From there, BoloBridge will suggest targeted games and, if needed, professional referral guidance.",
    "Tongue Gym is a great warm-up for younger children — short oral motor exercises that build the muscle coordination needed for clear speech.",
    "Emotion Echo trains prosody — the rhythm, stress, and intonation of speech. This is often overlooked but is important for natural-sounding communication.",
    "The Reader game supports oral reading fluency, which research links strongly to overall language and speech development. It works with any text or PDF.",
  ];

  let idx: number;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * genericResponses.length);
    attempts++;
  } while (recentGenericIndices.includes(idx) && attempts < 20);

  recentGenericIndices.push(idx);
  if (recentGenericIndices.length > 3) recentGenericIndices.shift();

  return genericResponses[idx];
}

/* ------------------------------------------------------------------ */
/*  Locale → language name map                                         */
/* ------------------------------------------------------------------ */

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  hi: 'Hindi',
  af: 'Afrikaans',
  bn: 'Bengali',
  tl: 'Tagalog',
};

/* ------------------------------------------------------------------ */
/*  API Route Handler                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const limit = rateLimit(req, { maxRequests: 20, windowMs: 60_000, prefix: 'chat' });
  if (!limit.ok) {
    return NextResponse.json({ unavailable: true, reason: 'rate-limit' }, { status: 429 });
  }

  let message = '';
  let history: { role: string; content: string }[] = [];

  try {
    const rawBody = await req.json();

    // Validate input
    const parsed = validateBody(chatSchema, rawBody);
    if (!parsed.ok) return parsed.response;

    const { message: validatedMessage, history: validatedHistory } = parsed.data;
    message = validatedMessage;
    history = validatedHistory;

    const locale =
      typeof rawBody?.locale === 'string' && rawBody.locale in LANGUAGE_NAMES
        ? rawBody.locale
        : 'en';
    const languageName = LANGUAGE_NAMES[locale];

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, use fallback responses
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        response: getFallbackResponse(message, history),
        source: 'fallback',
      });
    }

    // Use Gemini API
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `ALWAYS respond in ${languageName}. The user's interface is set to ${languageName}.

You are Vivi, a friendly speech buddy mascot for BoloBridge, a speech wellness platform for children ages 3-12.

Your personality:
- Warm, encouraging, and patient
- Use simple language that parents can understand
- Do not use emojis in your responses
- Keep responses concise (2-4 sentences typically)
- Never diagnose or provide clinical advice
- Always recommend consulting a speech-language pathologist for clinical concerns
- You can explain speech sounds, give practice tips, and encourage families
- Reference BoloBridge features when relevant (games, screening, learning modules)

Important guidelines:
- This is a wellness/educational tool, NOT a medical device
- Never claim to diagnose speech disorders
- Encourage professional consultation when concerns arise
- Focus on positive reinforcement and evidence-based guidance
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
    const responseText = result.response.text() || getFallbackResponse(message, history);

    return NextResponse.json({
      response: responseText,
      source: 'gemini',
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json({
      unavailable: true,
      reason: 'error',
    });
  }
}
