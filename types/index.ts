export interface ChildProfile {
  name: string;
  age: number;
  avatarId: string;
  language: 'en' | 'es' | 'hi' | 'af' | 'bn' | 'tl' | 'pt' | 'ar' | 'ru' | 'vi';
  createdAt: string;
  userRole?: 'parent' | 'child';
}

export interface ExerciseResult {
  exerciseId: string;
  gameType: GameType;
  score: number;
  maxScore: number;
  completedAt: string;
  soundsTargeted: string[];
}

export type GameType = 'sound-safari' | 'tongue-gym' | 'word-garden' | 'rhythm-river' | 'story-studio' | 'emotion-echo' | 'reader';

export interface ProgressData {
  totalExercises: number;
  soundsMastered: string[];
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  badges: Badge[];
  exerciseHistory: ExerciseResult[];
  lastActiveDate: string;
  totalTimeMinutes: number;
  skillScores: SkillScores;
}

export interface SkillScores {
  articulation: number;
  vocabulary: number;
  fluency: number;
  oralMotor: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 1 | 2 | 3;
  steps: ModuleStep[];
  completed: boolean;
}

export interface ModuleStep {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'interactive' | 'quiz';
  illustration?: string;
}

export interface Exercise {
  id: string;
  gameType: GameType;
  targetSound: string;
  word: string;
  wordHindi?: string;
  wordSpanish?: string;
  wordAfrikaans?: string;
  wordBengali?: string;
  wordTagalog?: string;
  wordPortuguese?: string;
  wordArabic?: string;
  wordRussian?: string;
  wordVietnamese?: string;
  translations?: Record<string, string>;
  imageEmoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  environment?: string;
  category?: string;
}

export interface DailyChallengeResult {
  date: string;
  exercises: ExerciseResult[];
  totalScore: number;
  timeSpentSeconds: number;
  completed: boolean;
}

export interface Milestone {
  ageMonths: number;
  description: string;
  category: 'articulation' | 'language' | 'fluency' | 'social';
  source: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Avatar {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
}

/* ------------------------------------------------------------------ */
/*  Speech & Screening types (Phase 2)                                 */
/* ------------------------------------------------------------------ */

export interface SpeechAttempt {
  word: string;
  expected: string;
  transcript: string;
  score: number;
  confidence: number;
  timestamp: string;
}

export interface PhonemeResult {
  sound: string;
  word: string;
  score: number;
  attempts: number;
  skipped: boolean;
  stimulable?: boolean;
  preHintScore?: number;
  postHintScore?: number;
  hintProvided?: boolean;
}

export type RiskLevel = 'on-track' | 'monitor' | 'consult';

export interface AssessmentResult {
  id: string;
  childAge: number;
  completedAt: string;
  categories: {
    id: string;
    name: string;
    phonemes: PhonemeResult[];
    riskLevel: RiskLevel;
    averageScore: number;
  }[];
  overallRisk: RiskLevel;
  overallScore: number;
  aiSummary?: string;
}

/* ------------------------------------------------------------------ */
/*  Cycles Approach types (Phase 3)                                    */
/* ------------------------------------------------------------------ */

export interface CycleTarget {
  phoneme: string;
  score: number;
}

export interface CycleProgress {
  currentCycleIndex: number;
  dayWithinCycle: number;
  trialCount: number;
  cycles: CycleTarget[][];
  startDate: string;
  clinicianTargets?: string[];
}

export interface VocalBiomarkerData {
  speakingRate: number;
  pauseFrequency: number;
  pitchVariability: number;
  averagePitch: number;
  volumeDynamics: number;
  recordingDurationMs: number;
  capturedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
