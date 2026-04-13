'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechService } from '@/lib/speech';

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(lang = 'en'): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const serviceRef = useRef<SpeechService | null>(null);
  const startingRef = useRef(false); // Double-click guard

  // Initialise on mount (client-side only)
  useEffect(() => {
    const supported = SpeechService.isSupported();
    setIsSupported(supported);

    if (supported) {
      serviceRef.current = new SpeechService();
      serviceRef.current.setLanguage(lang);
    }

    // Proactively check mic permission state via Permissions API
    let permissionStatus: PermissionStatus | null = null;
    const handlePermissionChange = () => {
      if (permissionStatus) {
        setPermissionState(permissionStatus.state as 'prompt' | 'granted' | 'denied');
      }
    };

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          permissionStatus = status;
          setPermissionState(status.state as 'prompt' | 'granted' | 'denied');
          status.addEventListener('change', handlePermissionChange);
        })
        .catch(() => {
          // Permissions API not supported for microphone in this browser
          setPermissionState('unknown');
        });
    }

    return () => {
      // Clean up: stop service and remove permission listener
      serviceRef.current?.stop();
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [lang]);

  const startListening = useCallback(async () => {
    // Double-click guard: prevent concurrent start calls
    if (startingRef.current) return;
    startingRef.current = true;

    if (!serviceRef.current) {
      setError(
        'Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.'
      );
      setIsListening(false);
      startingRef.current = false;
      return;
    }

    setError(null);
    setTranscript('');
    setConfidence(0);
    // Show "processing" state while we request permission
    setIsProcessing(true);

    // Await the async start() so permission errors are caught properly
    await serviceRef.current.start(
      (t, c) => {
        setTranscript(t);
        setConfidence(c);
        setIsListening(false);
        setIsProcessing(false);
        startingRef.current = false;
      },
      (err) => {
        setError(err);
        setIsListening(false);
        setIsProcessing(false);
        startingRef.current = false;
        // Update permission state if it was a denial
        if (
          err.toLowerCase().includes('denied') ||
          err.toLowerCase().includes('not-allowed') ||
          err.toLowerCase().includes('permission')
        ) {
          setPermissionState('denied');
        }
      }
    );

    // Only set isListening AFTER start() succeeds (permission confirmed)
    // If start() called onError, isListening stays false
    if (serviceRef.current.isListening) {
      setIsListening(true);
      setIsProcessing(false);
    } else {
      startingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    serviceRef.current?.stop();
    setIsListening(false);
    setIsProcessing(false);
    startingRef.current = false;
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    confidence,
    error,
    permissionState,
    startListening,
    stopListening,
    resetTranscript,
  };
}
