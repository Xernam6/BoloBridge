'use client';

import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { ChildProfile, ProgressData, ExerciseResult, SkillScores, AssessmentResult, ChatMessage, SpeechAttempt, DailyChallengeResult, CycleProgress, VocalBiomarkerData } from '@/types';
import { DEFAULT_BADGES, XP_PER_LEVEL } from './constants';
import { encryptData, decryptData, hashPin } from './crypto';

// ─── Encrypted Storage Adapter ──────────────────────────
// Wraps localStorage with AES-256-GCM encryption via Web Crypto API.
// Data is encrypted before writing and decrypted on read, so
// localStorage never contains plaintext user data.

const encryptedStorage: PersistStorage<AppState> = {
  getItem: async (name: string): Promise<StorageValue<AppState> | null> => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;

    try {
      // Try to decrypt (encrypted format)
      const decrypted = await decryptData(raw);
      return JSON.parse(decrypted);
    } catch {
      // Fall back to plain JSON for migration from unencrypted data
      try {
        const parsed = JSON.parse(raw);
        return parsed;
      } catch {
        return null;
      }
    }
  },
  setItem: async (name: string, value: StorageValue<AppState>): Promise<void> => {
    const json = JSON.stringify(value);
    const encrypted = await encryptData(json);
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

interface AppState {
  // Profile
  profile: ChildProfile | null;
  setProfile: (profile: ChildProfile) => void;
  clearProfile: () => void;

  // Progress
  progress: ProgressData;
  addExerciseResult: (result: ExerciseResult) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  updateSkillScores: (scores: Partial<SkillScores>) => void;

  // Dashboard PIN (stored as PBKDF2 hash — never plaintext)
  dashboardPinHash: string;
  setDashboardPin: (pin: string) => Promise<void>;
  verifyDashboardPin: (pin: string) => Promise<boolean>;
  isDashboardUnlocked: boolean;
  unlockDashboard: () => void;
  lockDashboard: () => void;

  // Settings
  soundEnabled: boolean;
  toggleSound: () => void;

  // Module progress
  completedModules: string[];
  completeModule: (moduleId: string) => void;

  // Speech & Screening
  assessmentResults: AssessmentResult[];
  addAssessmentResult: (result: AssessmentResult) => void;
  lastSpeechAttempt: SpeechAttempt | null;
  setLastSpeechAttempt: (attempt: SpeechAttempt) => void;

  // Chat
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;

  // Daily Challenge
  dailyChallengeResults: DailyChallengeResult[];
  addDailyChallengeResult: (result: DailyChallengeResult) => void;
  hasCompletedDailyChallenge: () => boolean;

  // Cycles Approach
  cycleProgress: CycleProgress | null;
  setCycleProgress: (progress: CycleProgress) => void;
  incrementTrialCount: (count?: number) => void;

  // Vocal Biomarkers
  vocalBiomarkers: VocalBiomarkerData[];
  addVocalBiomarker: (data: VocalBiomarkerData) => void;

  // Clinician
  clinicianCode: string | null;
  generateClinicianCode: () => string;

  // Settings
  appLanguage: string;
  setAppLanguage: (lang: string) => void;
  textSize: number;
  setTextSize: (size: number) => void;
  hasCompletedScreening: () => boolean;
}

const initialProgress: ProgressData = {
  totalExercises: 0,
  soundsMastered: [],
  currentStreak: 0,
  longestStreak: 0,
  xp: 0,
  level: 1,
  badges: DEFAULT_BADGES,
  exerciseHistory: [],
  lastActiveDate: '',
  totalTimeMinutes: 0,
  skillScores: {
    articulation: 0,
    vocabulary: 0,
    fluency: 0,
    oralMotor: 0,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Profile
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),

      // Progress
      progress: initialProgress,
      addExerciseResult: (result) => {
        const state = get();
        const history = [...state.progress.exerciseHistory, result];
        const totalExercises = state.progress.totalExercises + 1;
        const soundsMastered = [...new Set([...state.progress.soundsMastered, ...result.soundsTargeted])];

        set({
          progress: {
            ...state.progress,
            totalExercises,
            soundsMastered,
            exerciseHistory: history,
          },
        });
      },
      addXP: (amount) => {
        const state = get();
        const newXP = state.progress.xp + amount;
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
        set({
          progress: {
            ...state.progress,
            xp: newXP,
            level: newLevel,
          },
        });
      },
      updateStreak: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const lastActive = state.progress.lastActiveDate;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = state.progress.currentStreak;
        if (lastActive === today) return;
        if (lastActive === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        set({
          progress: {
            ...state.progress,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, state.progress.longestStreak),
            lastActiveDate: today,
          },
        });
      },
      updateSkillScores: (scores) => {
        const state = get();
        set({
          progress: {
            ...state.progress,
            skillScores: { ...state.progress.skillScores, ...scores },
          },
        });
      },

      // Dashboard (PIN stored as PBKDF2-SHA256 hash)
      dashboardPinHash: '',
      setDashboardPin: async (pin) => {
        const hash = await hashPin(pin);
        set({ dashboardPinHash: hash });
      },
      verifyDashboardPin: async (pin) => {
        const state = get();
        // If no hash stored yet (first run / migration), accept '1234' and hash it
        if (!state.dashboardPinHash) {
          if (pin === '1234') {
            const hash = await hashPin('1234');
            set({ dashboardPinHash: hash });
            return true;
          }
          return false;
        }
        const hash = await hashPin(pin);
        return hash === state.dashboardPinHash;
      },
      isDashboardUnlocked: false,
      unlockDashboard: () => set({ isDashboardUnlocked: true }),
      lockDashboard: () => set({ isDashboardUnlocked: false }),

      // Settings
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      // Modules
      completedModules: [],
      completeModule: (moduleId) => {
        const state = get();
        if (!state.completedModules.includes(moduleId)) {
          set({ completedModules: [...state.completedModules, moduleId] });
        }
      },

      // Speech & Screening
      assessmentResults: [],
      addAssessmentResult: (result) => {
        const state = get();
        set({ assessmentResults: [...state.assessmentResults, result] });
      },
      lastSpeechAttempt: null,
      setLastSpeechAttempt: (attempt) => set({ lastSpeechAttempt: attempt }),

      // Chat
      chatHistory: [],
      addChatMessage: (message) => {
        const state = get();
        set({ chatHistory: [...state.chatHistory, message] });
      },
      clearChatHistory: () => set({ chatHistory: [] }),

      // Daily Challenge
      dailyChallengeResults: [],
      addDailyChallengeResult: (result) => {
        const state = get();
        set({ dailyChallengeResults: [...state.dailyChallengeResults, result] });
      },
      hasCompletedDailyChallenge: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        return state.dailyChallengeResults.some(
          (r) => r.date === today && r.completed
        );
      },

      // Cycles Approach
      cycleProgress: null,
      setCycleProgress: (progress) => set({ cycleProgress: progress }),
      incrementTrialCount: (count = 1) => {
        const state = get();
        if (state.cycleProgress) {
          set({
            cycleProgress: {
              ...state.cycleProgress,
              trialCount: state.cycleProgress.trialCount + count,
            },
          });
        }
      },

      // Vocal Biomarkers
      vocalBiomarkers: [],
      addVocalBiomarker: (data) => {
        const state = get();
        set({ vocalBiomarkers: [...state.vocalBiomarkers, data] });
      },

      // Clinician
      clinicianCode: null,
      generateClinicianCode: () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        // Use crypto.getRandomValues for secure randomness
        const randomBytes = new Uint8Array(6);
        if (typeof globalThis.crypto !== 'undefined') {
          globalThis.crypto.getRandomValues(randomBytes);
        } else {
          // Fallback for environments without crypto
          for (let i = 0; i < 6; i++) randomBytes[i] = Math.floor(Math.random() * 256);
        }
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(randomBytes[i] % chars.length);
        }
        set({ clinicianCode: code });
        return code;
      },

      // Settings
      appLanguage: 'en',
      setAppLanguage: (lang) => set({ appLanguage: lang }),
      textSize: 2,
      setTextSize: (size) => set({ textSize: size }),
      hasCompletedScreening: () => {
        const state = get();
        return state.assessmentResults.length > 0;
      },
    }),
    {
      name: 'bolobridge-storage',
      storage: encryptedStorage,
    }
  )
);
