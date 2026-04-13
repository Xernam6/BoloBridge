/**
 * Cycles Approach Scheduling Algorithm
 *
 * Based on the Hodson & Paden Cycles Approach for phonological intervention.
 * Groups deficit phonemes into rotating cycles, targeting 2-3 phonemes per cycle
 * over ~6-week blocks. Within each cycle, exercises are weighted toward the
 * target phonemes to achieve high-dosage practice (goal: 5,000 trials).
 *
 * References: Unicomb et al. (2020), Benway & Preston (2024)
 */

import type { AssessmentResult, CycleTarget } from '@/types';

const CYCLE_LENGTH_DAYS = 42; // ~6 weeks per cycle
const PHONEMES_PER_CYCLE = 3;
const DEFICIT_THRESHOLD = 0.7;

/**
 * Build cycles from the most recent assessment results.
 * Groups deficit phonemes (score < 0.7) into cycles of 2-3,
 * ordered by severity (lowest score first).
 */
export function buildCycles(assessment: AssessmentResult): CycleTarget[][] {
  const deficits: CycleTarget[] = [];

  for (const category of assessment.categories) {
    for (const phoneme of category.phonemes) {
      if (!phoneme.skipped && phoneme.score < DEFICIT_THRESHOLD) {
        deficits.push({ phoneme: phoneme.sound, score: phoneme.score });
      }
    }
  }

  // Sort by score ascending (worst first — most severe deficits get priority)
  deficits.sort((a, b) => a.score - b.score);

  // Group into cycles of PHONEMES_PER_CYCLE
  const cycles: CycleTarget[][] = [];
  for (let i = 0; i < deficits.length; i += PHONEMES_PER_CYCLE) {
    cycles.push(deficits.slice(i, i + PHONEMES_PER_CYCLE));
  }

  return cycles;
}

/**
 * For a given day number (0-indexed from cycle start date),
 * determine which phonemes to target today.
 * Within a cycle block, rotates through target phonemes daily.
 */
export function getTargetPhonemesForDay(
  cycles: CycleTarget[][],
  dayNumber: number,
): string[] {
  if (cycles.length === 0) return [];

  const cycleIndex = Math.floor(dayNumber / CYCLE_LENGTH_DAYS) % cycles.length;
  const cycle = cycles[cycleIndex];

  if (!cycle || cycle.length === 0) return [];

  // Within a cycle, rotate which phoneme is primary focus each day
  const dayInCycle = dayNumber % CYCLE_LENGTH_DAYS;
  const primaryIndex = dayInCycle % cycle.length;

  // Return primary phoneme first, then others in the cycle for variety
  const targets = [cycle[primaryIndex].phoneme];
  for (let i = 0; i < cycle.length; i++) {
    if (i !== primaryIndex) {
      targets.push(cycle[i].phoneme);
    }
  }

  return targets;
}

/**
 * Score and rank exercises based on phoneme overlap with target sounds.
 * Returns IDs of the best-matching exercises.
 */
export function selectExercisesForPhonemes(
  targetPhonemes: string[],
  allExercises: { id: string; targetSound?: string; word: string }[],
  count: number = 10,
): string[] {
  // Score each exercise by how well it targets the desired phonemes
  const scored = allExercises.map((ex) => {
    let score = 0;
    const sound = (ex.targetSound || '').toLowerCase();

    // Direct targetSound match → highest weight
    if (targetPhonemes.some((p) => sound.includes(p.replace(/\//g, '').toLowerCase()))) {
      score += 10;
    }

    // Word contains target phonemes → secondary weight
    const wordLower = ex.word.toLowerCase();
    for (const phoneme of targetPhonemes) {
      const clean = phoneme.replace(/\//g, '').toLowerCase();
      if (wordLower.includes(clean)) score += 5;
    }

    // Small random factor for variety across days
    score += Math.random() * 2;

    return { id: ex.id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.id);
}

/**
 * Calculate day number since cycle start date.
 */
export function getDayNumber(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
