import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { screeningAnalyzeSchema, validateBody } from '@/lib/validation';

/* ------------------------------------------------------------------ */
/*  Deterministic fallback analysis                                    */
/* ------------------------------------------------------------------ */

interface PhonemeData {
  sound: string;
  score: number;
  skipped: boolean;
  stimulable?: boolean;
  preHintScore?: number;
  postHintScore?: number;
  hintProvided?: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  averageScore: number;
  riskLevel: string;
  phonemes: PhonemeData[];
}

function generateDeterministicSummary(categories: CategoryData[], childAge: number, overallRisk: string): string {
  const weakAreas = categories.filter((c) => c.riskLevel !== 'on-track');
  const strongAreas = categories.filter((c) => c.riskLevel === 'on-track');

  let summary = '';

  if (overallRisk === 'on-track') {
    summary = `Based on the screening results, your ${childAge}-year-old's speech sounds appear to be developing well for their age. `;
    if (strongAreas.length > 0) {
      summary += `Strong performance was observed in ${strongAreas.map((a) => a.name.toLowerCase()).join(', ')}. `;
    }
    summary += 'Continue encouraging speech practice through play and everyday conversation!';
  } else if (overallRisk === 'monitor') {
    summary = `Your ${childAge}-year-old showed solid skills in several areas but may benefit from extra practice with some sounds. `;
    if (weakAreas.length > 0) {
      summary += `Areas to focus on include ${weakAreas.map((a) => a.name.toLowerCase()).join(' and ')}. `;
      const weakPhonemes = weakAreas.flatMap((a) =>
        a.phonemes.filter((p) => p.score < 0.6 && !p.skipped).map((p) => p.sound)
      );
      if (weakPhonemes.length > 0) {
        summary += `Specifically, the sounds ${weakPhonemes.slice(0, 3).join(', ')} could use more practice. `;
      }
    }
    summary += 'Try targeted games in BoloBridge and consider re-screening in 2-3 months to track progress.';
  } else {
    summary = `The screening suggests your ${childAge}-year-old may benefit from professional evaluation for some speech sounds. `;
    if (weakAreas.length > 0) {
      summary += `Challenges were observed in ${weakAreas.map((a) => a.name.toLowerCase()).join(' and ')}. `;
    }
    summary +=
      'We recommend consulting a licensed speech-language pathologist who can provide a comprehensive evaluation. In the meantime, BoloBridge\'s games can provide supportive practice.';
  }

  // Append stimulability note if any sounds had dynamic assessment data
  const stimulablePhonemes: string[] = [];
  const notStimulablePhonemes: string[] = [];
  for (const cat of categories) {
    for (const p of cat.phonemes) {
      if (p.hintProvided) {
        if (p.stimulable) {
          stimulablePhonemes.push(p.sound);
        } else {
          notStimulablePhonemes.push(p.sound);
        }
      }
    }
  }
  if (stimulablePhonemes.length > 0 || notStimulablePhonemes.length > 0) {
    summary += '\n\n';
    if (stimulablePhonemes.length > 0) {
      summary += `Dynamic assessment showed that ${stimulablePhonemes.join(', ')} ${stimulablePhonemes.length === 1 ? 'was' : 'were'} stimulable (improved with cueing), which is a positive prognostic indicator. `;
    }
    if (notStimulablePhonemes.length > 0) {
      summary += `The sound${notStimulablePhonemes.length === 1 ? '' : 's'} ${notStimulablePhonemes.join(', ')} did not yet show improvement with cueing. Targeted practice or professional support may help.`;
    }
  }

  return summary;
}

/* ------------------------------------------------------------------ */
/*  API Route Handler                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const limit = rateLimit(req, { maxRequests: 10, windowMs: 60_000, prefix: 'screening' });
  if (!limit.ok) return limit.response;

  try {
    const rawBody = await req.json();

    // Validate input
    const parsed = validateBody(screeningAnalyzeSchema, rawBody);
    if (!parsed.ok) return parsed.response;

    const { categories, childAge, overallRisk } = parsed.data;

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, use deterministic analysis
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return NextResponse.json({
        summary: generateDeterministicSummary(categories, childAge, overallRisk),
        source: 'deterministic',
      });
    }

    // Use Gemini API for enhanced analysis
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Build stimulability summary for the AI prompt
    const stimulabilitySummaryLines: string[] = [];
    for (const c of categories) {
      for (const p of c.phonemes) {
        if (p.hintProvided) {
          const pre = p.preHintScore != null ? Math.round(p.preHintScore * 100) : '?';
          const post = p.postHintScore != null ? Math.round(p.postHintScore * 100) : '?';
          const label = p.stimulable ? 'STIMULABLE' : 'NOT stimulable';
          stimulabilitySummaryLines.push(
            `  - ${p.sound}: ${label} (pre-cue: ${pre}%, post-cue: ${post}%)`
          );
        }
      }
    }
    const stimulabilityBlock =
      stimulabilitySummaryLines.length > 0
        ? `\n\nStimulability / Dynamic Assessment results:\n${stimulabilitySummaryLines.join('\n')}`
        : '';

    const prompt = `You are a helpful assistant for BoloBridge, a speech wellness platform for children. Analyze the following speech screening results and provide a parent-friendly summary.

IMPORTANT: You are NOT a speech-language pathologist. Do NOT diagnose. Only summarize findings and provide general guidance.

For sounds where dynamic assessment was conducted (hintProvided=true), note whether the sound was stimulable (improved with cueing). This is a positive prognostic indicator per ASHA guidelines.

Child's age: ${childAge} years old
Overall risk level: ${overallRisk}

Category results:
${categories
  .map(
    (c) =>
      `- ${c.name} (avg score: ${Math.round(c.averageScore * 100)}%, risk: ${c.riskLevel}): ${c.phonemes
        .map((p) => {
          let entry = `${p.sound}: ${p.skipped ? 'skipped' : Math.round(p.score * 100) + '%'}`;
          if (p.hintProvided) {
            entry += ` [stimulable: ${p.stimulable ? 'yes' : 'no'}]`;
          }
          return entry;
        })
        .join(', ')}`
  )
  .join('\n')}${stimulabilityBlock}

Provide a 3-4 sentence parent-friendly summary that:
1. Acknowledges strengths
2. Notes any areas to practice (and mention stimulability results if available)
3. Provides appropriate next-step guidance
4. Maintains a positive, encouraging tone
5. Reminds that this is a screening, not a diagnosis`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction:
        'You are a helpful assistant for BoloBridge, a speech wellness app for children. Provide practical, parent-friendly guidance. Never diagnose conditions.',
    });

    const result = await model.generateContent(prompt);
    const summary = result.response.text() ||
      generateDeterministicSummary(categories, childAge, overallRisk);

    return NextResponse.json({
      summary,
      source: 'gemini',
    });
  } catch (error) {
    console.error('Screening analysis error:', error);

    return NextResponse.json({
      summary: 'Unable to generate analysis at this time. Please consult the detailed results below.',
      source: 'error',
    });
  }
}
