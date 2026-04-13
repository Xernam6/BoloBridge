/**
 * Web Speech API wrapper + fuzzy speech matching
 * Provides browser-native speech recognition with Levenshtein-based scoring
 */

/* ------------------------------------------------------------------ */
/*  Levenshtein distance for fuzzy speech comparison                    */
/* ------------------------------------------------------------------ */

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Compare expected vs actual speech, returns 0-1 score
 * Normalizes both strings (lowercase, trim, remove punctuation)
 */
export function compareSpeech(expected: string, actual: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/gi, '')
      .replace(/\s+/g, ' ');

  const a = normalize(expected);
  const b = normalize(actual);

  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);

  return Math.max(0, 1 - distance / maxLen);
}

/** Default threshold for a "match" */
export const MATCH_THRESHOLD = 0.6;

/* ------------------------------------------------------------------ */
/*  SpeechRecognition Service                                          */
/* ------------------------------------------------------------------ */

type SpeechResultCallback = (transcript: string, confidence: number) => void;
type SpeechErrorCallback = (error: string) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

/**
 * Robust speech recognition service.
 *
 * Strategy: Uses continuous=false (most compatible across browsers).
 * If the browser ends recognition before the user speaks, we
 * automatically restart up to MAX_RESTARTS times. A hard safety
 * timeout guarantees we always call back to React so the UI
 * never gets stuck in a "listening" state.
 */
export class SpeechService {
  private recognition: SpeechRecognitionInstance | null = null;
  private _isListening = false;

  // Per-session state (reset on each start() call)
  private lastTranscript = '';
  private lastConfidence = 0;
  private restartCount = 0;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private delivered = false;

  private static readonly MAX_RESTARTS = 5;
  private static readonly SAFETY_TIMEOUT_MS = 12_000; // 12 seconds max

  /** Check browser support */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as /* eslint-disable-line */ any).SpeechRecognition ||
      (window as /* eslint-disable-line */ any).webkitSpeechRecognition
    );
  }

  constructor() {
    if (!SpeechService.isSupported()) return;

    const SpeechRecognition =
      (window as /* eslint-disable-line */ any).SpeechRecognition ||
      (window as /* eslint-disable-line */ any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';
  }

  get isListening() {
    return this._isListening;
  }

  setLanguage(lang: string) {
    if (this.recognition) {
      const langMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-MX',
        hi: 'hi-IN',
        af: 'af-ZA',
        bn: 'bn-BD',
        tl: 'tl-PH',
      };
      this.recognition.lang = langMap[lang] || lang;
    }
  }

  async start(onResult: SpeechResultCallback, onError?: SpeechErrorCallback) {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    if (this._isListening) {
      this.stop();
    }

    // ── Step 1: Explicitly request microphone permission via getUserMedia ──
    // This ensures Chrome shows the permission prompt and we get a clear
    // error if the user denies it, rather than a silent fail from
    // SpeechRecognition.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted - stop the stream immediately (SpeechRecognition
      // opens its own audio pipeline)
      stream.getTracks().forEach((t) => t.stop());
    } catch (permErr) {
      // User denied, or no mic available
      const msg =
        permErr instanceof DOMException && permErr.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access in your browser settings and try again.'
          : permErr instanceof DOMException && permErr.name === 'NotFoundError'
          ? 'No microphone found. Please connect a microphone and try again.'
          : 'Could not access microphone. Please check your browser permissions.';
      onError?.(msg);
      return;
    }

    // ── Step 2: Reset per-session state ──
    this.lastTranscript = '';
    this.lastConfidence = 0;
    this.restartCount = 0;
    this.delivered = false;

    /** Deliver result exactly once, clean up timers */
    const deliver = (transcript: string, confidence: number) => {
      if (this.delivered) return;
      this.delivered = true;
      this._isListening = false;
      this.clearSafetyTimer();
      onResult(transcript, confidence);
    };

    /** Deliver error exactly once, clean up timers */
    const fail = (msg: string) => {
      if (this.delivered) return;
      this.delivered = true;
      this._isListening = false;
      this.clearSafetyTimer();
      onError?.(msg);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      const result = event.results[0]?.[0];
      if (result) {
        this.lastTranscript = result.transcript;
        this.lastConfidence = result.confidence ?? 0.8;
      }
      // With continuous=false the browser auto-stops after this;
      // onend will fire next and deliver the result.
    };

    this.recognition.onerror = (event: { error: string }) => {
      // These are transient - let onend handle restart
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      // Permission errors (shouldn't happen since we checked above, but just in case)
      if (event.error === 'not-allowed') {
        fail('Microphone access denied. Please allow microphone access in your browser settings.');
        return;
      }
      // Real errors
      fail(event.error);
    };

    this.recognition.onend = () => {
      if (this.delivered || !this._isListening) return;

      if (this.lastTranscript) {
        // Got speech - deliver it
        deliver(this.lastTranscript.trim(), this.lastConfidence);
      } else if (this.restartCount < SpeechService.MAX_RESTARTS) {
        // No speech captured yet - restart to keep listening
        this.restartCount++;
        try {
          this.recognition?.start();
        } catch {
          fail('Could not restart speech recognition. Please try again.');
        }
      } else {
        // Max restarts reached - give up gracefully
        fail('no-speech');
      }
    };

    // Hard safety timeout so the UI never gets stuck
    this.safetyTimer = setTimeout(() => {
      if (this.delivered) return;
      if (this.lastTranscript) {
        // We have partial speech - deliver what we have
        try { this.recognition?.stop(); } catch { /* ok */ }
        deliver(this.lastTranscript.trim(), this.lastConfidence);
      } else {
        try { this.recognition?.stop(); } catch { /* ok */ }
        fail('Recording timed out. Please try again.');
      }
    }, SpeechService.SAFETY_TIMEOUT_MS);

    // ── Step 3: Start recognition (mic already confirmed) ──
    this._isListening = true;
    try {
      this.recognition.start();
    } catch {
      this._isListening = false;
      this.clearSafetyTimer();
      onError?.('Could not start speech recognition. Please try again.');
    }
  }

  stop() {
    this.clearSafetyTimer();
    if (this.recognition && this._isListening) {
      this._isListening = false;
      try { this.recognition.stop(); } catch { /* already stopped */ }
    }
  }

  private clearSafetyTimer() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Text-to-Speech helper (for Rhythm River "Listen" button)           */
/* ------------------------------------------------------------------ */

export function speakText(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // slightly slower for children
    utterance.pitch = 1.1;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('Speech synthesis error'));

    window.speechSynthesis.cancel(); // cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  });
}
