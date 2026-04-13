import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES, INTERNATIONAL_RESOURCES } from '@/lib/constants';
import { rateLimit } from '@/lib/rate-limit';
import { findHelpSchema, validateBody } from '@/lib/validation';

/* ------------------------------------------------------------------ */
/*  Curated static resources (fallback when no API key)                 */
/* ------------------------------------------------------------------ */

const US_RESOURCES = [
  {
    name: 'ASHA ProFind',
    description:
      'The official directory of the American Speech-Language-Hearing Association. Search for certified SLPs by location, specialty, and language.',
    url: 'https://find.asha.org',
    type: 'directory',
    icon: '🏥',
  },
  {
    name: 'Early Intervention Services',
    description:
      'Free or low-cost speech services for children under 3 through your state\'s early intervention program. Contact your pediatrician for a referral.',
    url: 'https://www.cdc.gov/ncbddd/actearly/parents/states.html',
    type: 'government',
    icon: '🏛️',
  },
  {
    name: 'School-Based Services',
    description:
      'Children aged 3+ may qualify for free speech services through their school district. Contact your local school to request an evaluation.',
    url: '',
    type: 'school',
    icon: '🏫',
  },
  {
    name: 'Speechly (Telepractice)',
    description:
      'Online speech therapy sessions from certified SLPs, convenient for families in rural areas or those who prefer virtual appointments.',
    url: 'https://www.asha.org/practice/telepractice/',
    type: 'telehealth',
    icon: '💻',
  },
  {
    name: 'University Speech-Language Clinics',
    description:
      'Many universities with SLP programs offer low-cost services supervised by licensed professionals. Search for programs near you.',
    url: 'https://find.asha.org',
    type: 'clinic',
    icon: '🎓',
  },
  {
    name: 'Medicaid / CHIP',
    description:
      'If your family qualifies, Medicaid and the Children\'s Health Insurance Program (CHIP) cover speech therapy services for children.',
    url: 'https://www.medicaid.gov',
    type: 'insurance',
    icon: '📋',
  },
];

/* ------------------------------------------------------------------ */
/*  Build resources list based on country                               */
/* ------------------------------------------------------------------ */

interface ResourceEntry {
  name: string;
  description: string;
  url: string;
  type: string;
  icon: string;
}

function getResourcesForCountry(country: string): ResourceEntry[] {
  if (country === 'US') {
    return US_RESOURCES;
  }

  const countryResources: ResourceEntry[] = INTERNATIONAL_RESOURCES
    .filter((r) => r.countries.length === 0 || (r.countries as readonly string[]).includes(country))
    .map((r) => ({
      name: r.name as string,
      description: r.description as string,
      url: r.url as string,
      type: 'directory',
      icon: r.icon as string,
    }));

  countryResources.push({
    name: 'School-Based Services',
    description:
      'Children may qualify for speech services through their local school or education authority. Contact your school to inquire about evaluations.',
    url: '',
    type: 'school',
    icon: '🏫',
  });

  countryResources.push({
    name: 'University Speech-Language Clinics',
    description:
      'Many universities with speech-language programs offer low-cost services supervised by licensed professionals.',
    url: '',
    type: 'clinic',
    icon: '🎓',
  });

  return countryResources;
}

function buildFallbackResponse(location: string, country: string = 'US') {
  const countryData = COUNTRIES.find((c) => c.code === country);
  const countryName = countryData?.name || 'your country';
  const resources = getResourcesForCountry(country);

  const isUS = country === 'US';

  const summary = isUS
    ? `Here are resources to help you find speech therapy services${
        location ? ` near ${location}` : ''
      }. We recommend starting with ASHA ProFind to find a certified speech-language pathologist in your area.`
    : `Here are resources to help you find speech therapy services${
        location ? ` near ${location}` : ''
      } in ${countryName}. Browse the directories below to find a qualified speech-language professional.`;

  const tips = isUS
    ? [
        'Ask your pediatrician for a referral. They often know local SLPs.',
        'Contact your local school district for free evaluations (ages 3+).',
        'For children under 3, ask about your state\'s Early Intervention program.',
        'University speech clinics often offer sliding-scale fees.',
        'Many SLPs now offer telehealth sessions, expanding your options.',
      ]
    : [
        'Ask your family doctor or pediatrician for a referral to a speech-language professional.',
        'Contact your local school or education authority about speech services for children.',
        'For young children, ask about early intervention or developmental programs in your area.',
        'University speech clinics often offer affordable services.',
        'Many speech-language professionals now offer telehealth sessions, expanding your options across borders.',
      ];

  return {
    location,
    summary,
    resources,
    tips,
    source: 'fallback' as const,
  };
}

/* ------------------------------------------------------------------ */
/*  API Route Handler                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const limit = rateLimit(req, { maxRequests: 10, windowMs: 60_000, prefix: 'find-help' });
  if (!limit.ok) return limit.response;

  try {
    const rawBody = await req.json();

    // Validate input
    const parsed = validateBody(findHelpSchema, rawBody);
    if (!parsed.ok) return parsed.response;

    const { location, childAge, concerns, country } = parsed.data;

    const countryData = COUNTRIES.find((c) => c.code === country);
    const countryName = countryData?.name || 'Unknown';
    const isUS = country === 'US';
    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, return curated resources
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return NextResponse.json(buildFallbackResponse(location, country));
    }

    // Use Gemini API for personalized guidance
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction:
        'You are a helpful assistant for BoloBridge, a speech wellness app for children used globally. Provide practical guidance for finding speech therapy resources appropriate to the user\'s country. Always respond in valid JSON format only. Never diagnose conditions.',
    });

    const prompt = `A parent is looking for speech therapy resources.
${location ? `Location: ${location}` : 'Location not specified'}
Country: ${countryName} (${country})
${childAge ? `Child's age: ${childAge} years old` : ''}
${concerns ? `Concerns: ${concerns}` : ''}

Please provide a helpful, concise response in the following JSON format:
{
  "summary": "A 2-3 sentence personalized overview of their options",
  "localTips": ["3-5 specific, actionable tips for finding help in their area"],
  "searchSuggestions": ["2-3 search terms they can use to find local speech-language professionals"]
}

Guidelines:
- Be warm, encouraging, and non-clinical
- The user is located in ${countryName}. Tailor all recommendations to their country.
${isUS ? '- Recommend ASHA ProFind (find.asha.org) as a primary resource for finding certified SLPs.' : '- Do NOT recommend ASHA ProFind or other US-specific resources. Instead, recommend speech-language professional directories and services available in ' + countryName + '.'}
${isUS ? '- If a US location is given, mention state-specific early intervention program names if known.' : '- Reference relevant national speech-language associations, health services, or government programs in ' + countryName + '.'}
- Mention early intervention for children under 3
- Mention school-based services for children 3+
- Always remind them that early intervention leads to better outcomes
- Never diagnose or claim to diagnose any condition
- Keep tips practical and actionable
- Use terminology appropriate for ${countryName} (e.g., "speech therapist" may be more common than "SLP" outside the US)
- Return ONLY the JSON object, no other text`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let aiResponse: { summary?: string; localTips?: string[]; searchSuggestions?: string[] } = {};
    try {
      aiResponse = JSON.parse(responseText);
    } catch {
      aiResponse = {};
    }

    const fallback = buildFallbackResponse(location, country);

    return NextResponse.json({
      location,
      summary: aiResponse.summary || fallback.summary,
      resources: getResourcesForCountry(country),
      tips: aiResponse.localTips || fallback.tips,
      searchSuggestions: aiResponse.searchSuggestions || [],
      source: 'gemini',
    });
  } catch (error) {
    console.error('Find Help API error:', error);
    return NextResponse.json(buildFallbackResponse('', 'US'));
  }
}
