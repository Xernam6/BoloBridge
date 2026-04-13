import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { clinicianSchema, validateBody } from '@/lib/validation';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface PhonemeData {
  sound: string;
  score: number;
  skipped: boolean;
  attempts: number;
  stimulable?: boolean;
  preHintScore?: number;
  postHintScore?: number;
  hintProvided?: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  phonemes: PhonemeData[];
  riskLevel: string;
  averageScore: number;
}

interface AssessmentData {
  id: string;
  childAge: number;
  completedAt: string;
  categories: CategoryData[];
  overallRisk: string;
  overallScore: number;
}

interface CycleTargetData {
  phoneme: string;
  score: number;
}

interface CycleData {
  currentCycleIndex: number;
  dayWithinCycle: number;
  trialCount: number;
  cycles: CycleTargetData[][];
  startDate: string;
  clinicianTargets?: string[];
}

interface ClinicalPhonemeReport {
  phoneme: string;
  percentCorrect: number;
  status: 'acquired' | 'emerging' | 'not-acquired';
  attempts: number;
  stimulable: boolean | null;
  stimulabilityGain: number | null;
}

interface ClinicalCategoryReport {
  category: string;
  severity: 'within-normal-limits' | 'mild' | 'moderate' | 'severe';
  meanPCC: number;
  phonemes: ClinicalPhonemeReport[];
}

interface CycleReport {
  currentCycleNumber: number;
  totalCycles: number;
  dayInCurrentCycle: number;
  trialCount: number;
  trialGoal: number;
  dosagePercentComplete: number;
  currentTargets: { phoneme: string; baselineScore: number }[];
  clinicianOverrides: string[];
  cycleStartDate: string;
  estimatedCycleEndDate: string;
}

interface ClinicalReport {
  generatedAt: string;
  childAge: number | null;
  assessmentDate: string | null;
  pcc: number | null;
  pccSeverity: string | null;
  overallRisk: string | null;
  categories: ClinicalCategoryReport[];
  cycleReport: CycleReport | null;
  recommendations: string[];
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const MATCH_THRESHOLD = 0.6;
const TRIAL_GOAL = 5_000;
const CYCLE_LENGTH_DAYS = 42;

/* ================================================================== */
/*  Helper Functions                                                   */
/* ================================================================== */

function classifyPhonemeStatus(score: number): 'acquired' | 'emerging' | 'not-acquired' {
  if (score >= 0.8) return 'acquired';
  if (score >= MATCH_THRESHOLD) return 'emerging';
  return 'not-acquired';
}

function classifyCategorySeverity(
  meanPCC: number
): 'within-normal-limits' | 'mild' | 'moderate' | 'severe' {
  if (meanPCC >= 85) return 'within-normal-limits';
  if (meanPCC >= 65) return 'mild';
  if (meanPCC >= 50) return 'moderate';
  return 'severe';
}

function classifyOverallSeverity(pcc: number): string {
  if (pcc >= 85) return 'Mild';
  if (pcc >= 65) return 'Mild-Moderate';
  if (pcc >= 50) return 'Moderate-Severe';
  return 'Severe';
}

function formatClinicalPhoneme(phoneme: PhonemeData): ClinicalPhonemeReport {
  const stimulabilityGain =
    phoneme.hintProvided &&
    phoneme.preHintScore != null &&
    phoneme.postHintScore != null
      ? phoneme.postHintScore - phoneme.preHintScore
      : null;

  return {
    phoneme: phoneme.sound,
    percentCorrect: Math.round(phoneme.score * 100),
    status: classifyPhonemeStatus(phoneme.score),
    attempts: phoneme.attempts,
    stimulable: phoneme.stimulable ?? null,
    stimulabilityGain:
      stimulabilityGain !== null ? Math.round(stimulabilityGain * 100) : null,
  };
}

function formatClinicalCategory(category: CategoryData): ClinicalCategoryReport {
  const tested = category.phonemes.filter((p) => !p.skipped);
  const passed = tested.filter((p) => p.score >= MATCH_THRESHOLD);
  const meanPCC = tested.length > 0 ? (passed.length / tested.length) * 100 : 0;

  return {
    category: category.name,
    severity: classifyCategorySeverity(meanPCC),
    meanPCC: Math.round(meanPCC * 10) / 10,
    phonemes: tested.map(formatClinicalPhoneme),
  };
}

function generateRecommendations(
  pcc: number | null,
  categories: ClinicalCategoryReport[],
  cycleData: CycleData | null
): string[] {
  const recommendations: string[] = [];

  if (pcc !== null) {
    if (pcc < 50) {
      recommendations.push(
        'PCC indicates severe involvement. Recommend comprehensive speech-language evaluation and consideration of intensive intervention frequency.'
      );
    } else if (pcc < 65) {
      recommendations.push(
        'PCC indicates moderate-severe involvement. Recommend formal evaluation and structured intervention targeting error patterns.'
      );
    } else if (pcc < 85) {
      recommendations.push(
        'PCC indicates mild-moderate involvement. Targeted intervention for specific deficit phonemes is recommended.'
      );
    } else {
      recommendations.push(
        'PCC is within the mild range. Monitor and provide targeted practice for any remaining deficit sounds.'
      );
    }
  }

  const severeCategories = categories.filter((c) => c.severity === 'severe');
  if (severeCategories.length > 0) {
    recommendations.push(
      `Severe deficits noted in: ${severeCategories.map((c) => c.category).join(', ')}. Prioritize these categories in intervention planning.`
    );
  }

  const stimulablePhonemes = categories
    .flatMap((c) => c.phonemes)
    .filter((p) => p.stimulable === true && p.status === 'not-acquired');
  if (stimulablePhonemes.length > 0) {
    recommendations.push(
      `Stimulable but not yet acquired: ${stimulablePhonemes.map((p) => `/${p.phoneme}/`).join(', ')}. These are strong candidates for immediate intervention targets.`
    );
  }

  if (cycleData) {
    const dosagePct = (cycleData.trialCount / TRIAL_GOAL) * 100;
    if (dosagePct < 25) {
      recommendations.push(
        'Home practice dosage is below 25% of the recommended trial count. Encourage increased practice frequency to maximize treatment outcomes.'
      );
    } else if (dosagePct >= 80) {
      recommendations.push(
        'Home practice dosage is approaching the target of 5,000 trials. Consider reassessment to evaluate progress and update cycle targets.'
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Continue current home practice regimen and monitor progress through periodic reassessment.'
    );
  }

  return recommendations;
}

function formatCycleReport(cycleData: CycleData): CycleReport {
  const currentTargets =
    cycleData.cycles.length > 0
      ? (cycleData.cycles[cycleData.currentCycleIndex % cycleData.cycles.length] || []).map(
          (t) => ({
            phoneme: t.phoneme,
            baselineScore: Math.round(t.score * 100),
          })
        )
      : [];

  const startDate = new Date(cycleData.startDate);
  const estimatedEnd = new Date(startDate);
  estimatedEnd.setDate(
    estimatedEnd.getDate() +
      CYCLE_LENGTH_DAYS * (cycleData.currentCycleIndex + 1)
  );

  return {
    currentCycleNumber: cycleData.currentCycleIndex + 1,
    totalCycles: cycleData.cycles.length,
    dayInCurrentCycle: cycleData.dayWithinCycle,
    trialCount: cycleData.trialCount,
    trialGoal: TRIAL_GOAL,
    dosagePercentComplete:
      Math.round((cycleData.trialCount / TRIAL_GOAL) * 1000) / 10,
    currentTargets,
    clinicianOverrides: cycleData.clinicianTargets || [],
    cycleStartDate: cycleData.startDate,
    estimatedCycleEndDate: estimatedEnd.toISOString().split('T')[0],
  };
}

/* ================================================================== */
/*  API Route Handler                                                  */
/* ================================================================== */

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes (auth-level protection)
  const limit = rateLimit(req, { maxRequests: 5, windowMs: 15 * 60 * 1000, prefix: 'clinician-auth' });
  if (!limit.ok) return limit.response;

  try {
    const rawBody = await req.json();

    // Validate input structure
    const parsed = validateBody(clinicianSchema, rawBody);
    if (!parsed.ok) return parsed.response;

    const { code, assessmentData, cycleData } = parsed.data;

    // ── Server-side code verification ──
    // The code is a HMAC-SHA256 digest of the assessment ID + a server secret.
    // If no CLINICIAN_SECRET is configured, fall back to format-only validation
    // (the Zod schema already enforces /^[A-Z0-9]{4,8}$/).
    const secret = process.env.CLINICIAN_SECRET;
    if (secret) {
      const { subtle } = globalThis.crypto;
      const key = await subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const dataToSign = assessmentData?.id ?? 'no-assessment';
      const sig = await subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
      const expectedCode = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(36).toUpperCase())
        .join('')
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);
      if (code !== expectedCode) {
        return NextResponse.json(
          { error: 'Invalid clinician access code' },
          { status: 403 }
        );
      }
    }

    // Build the clinical report
    const report: ClinicalReport = {
      generatedAt: new Date().toISOString(),
      childAge: assessmentData?.childAge ?? null,
      assessmentDate: assessmentData?.completedAt ?? null,
      pcc: null,
      pccSeverity: null,
      overallRisk: assessmentData?.overallRisk ?? null,
      categories: [],
      cycleReport: null,
      recommendations: [],
    };

    // Process assessment data
    if (assessmentData && assessmentData.categories) {
      // Calculate overall PCC
      const allPhonemes = assessmentData.categories.flatMap((c) => c.phonemes);
      const tested = allPhonemes.filter((p) => !p.skipped);
      const passed = tested.filter((p) => p.score >= MATCH_THRESHOLD);

      if (tested.length > 0) {
        report.pcc = Math.round((passed.length / tested.length) * 1000) / 10;
        report.pccSeverity = classifyOverallSeverity(report.pcc);
      }

      // Format categories
      report.categories = assessmentData.categories.map(formatClinicalCategory);
    }

    // Process cycle data
    if (cycleData) {
      report.cycleReport = formatCycleReport(cycleData);
    }

    // Generate clinical recommendations
    report.recommendations = generateRecommendations(
      report.pcc,
      report.categories,
      cycleData ?? null
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error('Clinician API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process clinical data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
