'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { VocalBiomarkerData } from '@/types';

// ── Constants ───────────────────────────────────────────────────────
const FFT_SIZE = 2048;
const SILENCE_RMS_THRESHOLD = 0.015; // below this RMS we consider silence
const PEAK_RMS_THRESHOLD = 0.04; // above this RMS we consider a syllable energy peak
const MIN_F0_HZ = 75;
const MAX_F0_HZ = 600;

// ── Hook return type ────────────────────────────────────────────────
interface UseVocalBiomarkersReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  biomarkers: VocalBiomarkerData | null;
  isRecording: boolean;
  error: string | null;
}

// ── Autocorrelation-based F0 estimation ────────────────────────────
function estimateF0(buffer: Float32Array, sampleRate: number): number | null {
  const minLag = Math.floor(sampleRate / MAX_F0_HZ);
  const maxLag = Math.floor(sampleRate / MIN_F0_HZ);

  if (maxLag >= buffer.length) return null;

  // Compute normalised autocorrelation for each candidate lag
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < buffer.length - maxLag; i++) {
      numerator += buffer[i] * buffer[i + lag];
      denomA += buffer[i] * buffer[i];
      denomB += buffer[i + lag] * buffer[i + lag];
    }

    const denom = Math.sqrt(denomA * denomB);
    if (denom === 0) continue;

    const correlation = numerator / denom;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  // Require a reasonable correlation strength to accept the estimate
  if (bestLag < 0 || bestCorrelation < 0.3) return null;

  return sampleRate / bestLag;
}

// ── Compute RMS of a Float32Array ──────────────────────────────────
function computeRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

// ── The Hook ───────────────────────────────────────────────────────
export function useVocalBiomarkers(): UseVocalBiomarkersReturn {
  const [biomarkers, setBiomarkers] = useState<VocalBiomarkerData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs that persist across renders but don't trigger re-render
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const recordingRef = useRef(false); // mirror to avoid stale closure

  // Accumulated sample buffers collected during the recording session
  const rmsHistoryRef = useRef<number[]>([]);
  const f0HistoryRef = useRef<number[]>([]);
  const peakCountRef = useRef(0);
  const silenceCountRef = useRef(0);
  const prevWasSilenceRef = useRef(true);
  const prevWasPeakRef = useRef(false);
  const startTimeRef = useRef(0);

  // ── Analysis loop (runs via requestAnimationFrame) ───────────────
  const analyse = useCallback(() => {
    if (!recordingRef.current || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const timeDomainData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(timeDomainData);

    // 1. RMS energy
    const rms = computeRMS(timeDomainData);
    rmsHistoryRef.current.push(rms);

    // 2. Speaking rate proxy: count upward threshold crossings (energy peaks)
    const isPeak = rms > PEAK_RMS_THRESHOLD;
    if (isPeak && !prevWasPeakRef.current) {
      peakCountRef.current += 1;
    }
    prevWasPeakRef.current = isPeak;

    // 3. Pause detection: transition into silence
    const isSilence = rms < SILENCE_RMS_THRESHOLD;
    if (isSilence && !prevWasSilenceRef.current) {
      silenceCountRef.current += 1;
    }
    prevWasSilenceRef.current = isSilence;

    // 4. Pitch (F0) estimation via autocorrelation
    const sampleRate = audioContextRef.current?.sampleRate ?? 44100;
    const f0 = estimateF0(timeDomainData, sampleRate);
    if (f0 !== null) {
      f0HistoryRef.current.push(f0);
    }

    // Schedule next frame
    rafIdRef.current = requestAnimationFrame(analyse);
  }, []);

  // ── Start recording ──────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    setBiomarkers(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Reset accumulators
      rmsHistoryRef.current = [];
      f0HistoryRef.current = [];
      peakCountRef.current = 0;
      silenceCountRef.current = 0;
      prevWasSilenceRef.current = true;
      prevWasPeakRef.current = false;
      startTimeRef.current = performance.now();

      recordingRef.current = true;
      setIsRecording(true);

      // Kick off the analysis loop
      rafIdRef.current = requestAnimationFrame(analyse);
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      let message: string;
      switch (name) {
        case 'NotAllowedError':
        case 'SecurityError':
          message = 'Microphone access was denied. Please allow microphone permission in your browser and try again.';
          break;
        case 'NotFoundError':
        case 'OverconstrainedError':
          message = 'No microphone was detected. Please connect a microphone and try again.';
          break;
        case 'NotReadableError':
          message = 'Your microphone is in use by another app. Please close it and try again.';
          break;
        default:
          message = (err instanceof Error && err.message) || 'Failed to access microphone.';
      }
      setError(message);
    }
  }, [analyse]);

  // ── Stop recording & compute final biomarkers ────────────────────
  const stopRecording = useCallback(() => {
    recordingRef.current = false;
    setIsRecording(false);

    // Cancel animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        /* swallow – context may already be closed */
      });
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // ── Compute final metrics ────────────────────────────────────
    const durationMs = performance.now() - startTimeRef.current;
    const durationSec = durationMs / 1000;
    const durationMin = durationSec / 60;

    if (durationSec < 0.5) {
      // Recording too short to produce meaningful data
      setError('Recording was too short. Please record for at least 1 second.');
      return;
    }

    // Speaking rate: energy-peak count / seconds  (syllable proxy / sec)
    const speakingRate =
      durationSec > 0 ? peakCountRef.current / durationSec : 0;

    // Pause frequency: silence-gap transitions / minutes
    const pauseFrequency =
      durationMin > 0 ? silenceCountRef.current / durationMin : 0;

    // Pitch metrics
    const f0Values = f0HistoryRef.current;
    let averagePitch = 0;
    let pitchVariability = 0;

    if (f0Values.length > 0) {
      const sum = f0Values.reduce((a, b) => a + b, 0);
      averagePitch = sum / f0Values.length;

      const variance =
        f0Values.reduce((acc, v) => acc + (v - averagePitch) ** 2, 0) /
        f0Values.length;
      pitchVariability = Math.sqrt(variance);
    }

    // Volume dynamics: variance of RMS values over time
    const rmsValues = rmsHistoryRef.current;
    let volumeDynamics = 0;

    if (rmsValues.length > 0) {
      const rmsMean = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
      volumeDynamics =
        rmsValues.reduce((acc, v) => acc + (v - rmsMean) ** 2, 0) /
        rmsValues.length;
    }

    const result: VocalBiomarkerData = {
      speakingRate: parseFloat(speakingRate.toFixed(2)),
      pauseFrequency: parseFloat(pauseFrequency.toFixed(2)),
      pitchVariability: parseFloat(pitchVariability.toFixed(2)),
      averagePitch: parseFloat(averagePitch.toFixed(2)),
      volumeDynamics: parseFloat(volumeDynamics.toFixed(6)),
      recordingDurationMs: Math.round(durationMs),
      capturedAt: new Date().toISOString(),
    };

    setBiomarkers(result);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      recordingRef.current = false;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { startRecording, stopRecording, biomarkers, isRecording, error };
}
