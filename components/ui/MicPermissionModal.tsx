'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, AlertTriangle, Chrome, Globe, Monitor, MicOff } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface MicPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorMessage?: string | null;
}

export function MicPermissionModal({ isOpen, onClose, onRetry, errorMessage }: MicPermissionModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const errLower = errorMessage?.toLowerCase() ?? '';

  const isPermissionDenied =
    errLower.includes('not-allowed') ||
    errLower.includes('permission') ||
    errLower.includes('denied');

  const isNotSupported = errLower.includes('not supported');

  const isTimeout = errLower.includes('timed out') || errLower.includes('timeout');

  const isNoSpeech = errorMessage === 'no-speech' || errLower.includes('no speech');

  const isNoMicrophone =
    errLower.includes('no microphone') ||
    errLower.includes('notfounderror') ||
    errLower.includes('not found');

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus panel when opened for accessibility
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Determine header content
  const headerIcon = isNotSupported
    ? <Monitor size={24} className="text-coral" />
    : isNoMicrophone
    ? <MicOff size={24} className="text-coral" />
    : <AlertTriangle size={24} className="text-coral" />;

  const headerTitle = isNotSupported
    ? 'Browser Not Supported'
    : isNoMicrophone
    ? 'No Microphone Found'
    : isNoSpeech
    ? 'No Speech Detected'
    : isTimeout
    ? 'Recording Timed Out'
    : 'Microphone Access Needed';

  const headerSubtitle = isNotSupported
    ? 'This browser does not support speech recognition'
    : isNoMicrophone
    ? 'Please connect a microphone and try again'
    : isNoSpeech
    ? 'We could not hear you. Try speaking louder'
    : isTimeout
    ? 'The recording ended before hearing speech'
    : 'Speech exercises require your microphone';

  const showRetryButton = (isNoSpeech || isTimeout) && onRetry;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mic-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-[#2D3142] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.12)] overflow-hidden max-h-[90vh] overflow-y-auto outline-none"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="bg-coral/10 px-8 py-6 flex items-center gap-4 relative">
              <div className="w-12 h-12 bg-coral/20 rounded-xl flex items-center justify-center">
                {headerIcon}
              </div>
              <div>
                <h2 id="mic-modal-title" className="font-heading italic text-xl text-navy dark:text-white">
                  {headerTitle}
                </h2>
                <p className="text-sm font-body text-muted mt-0.5">
                  {headerSubtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/60 dark:bg-white/10 text-muted hover:text-navy dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {isNotSupported ? (
                <>
                  <p className="font-body text-sm text-muted leading-relaxed">
                    Speech recognition requires a browser that supports the Web Speech API.
                    Please switch to one of these browsers:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-navy dark:text-white font-body font-semibold text-sm">
                        <Chrome size={16} className="text-teal" />
                        Google Chrome (Recommended)
                      </div>
                      <p className="text-sm font-body text-muted">
                        Best speech recognition support on all platforms.
                      </p>
                    </div>
                    <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-navy dark:text-white font-body font-semibold text-sm">
                        <Monitor size={16} className="text-teal" />
                        Microsoft Edge
                      </div>
                      <p className="text-sm font-body text-muted">
                        Full speech recognition support on Windows and Mac.
                      </p>
                    </div>
                    <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-navy dark:text-white font-body font-semibold text-sm">
                        <Globe size={16} className="text-teal" />
                        Safari (Mac / iOS)
                      </div>
                      <p className="text-sm font-body text-muted">
                        Supported on macOS Ventura+ and iOS 14.5+.
                      </p>
                    </div>
                  </div>
                  <div className="bg-coral/10 rounded-xl px-4 py-3">
                    <p className="text-coral text-sm font-body font-semibold">
                      Arc, Brave, Firefox, and Opera do not support speech recognition.
                    </p>
                  </div>
                </>
              ) : isNoMicrophone ? (
                <>
                  <p className="font-body text-sm text-muted leading-relaxed">
                    We could not find a microphone connected to your device. Please:
                  </p>
                  <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-3">
                    <ol className="list-decimal list-inside text-sm font-body text-muted space-y-2 leading-relaxed">
                      <li>Check that your <strong>microphone or headset is plugged in</strong></li>
                      <li>If using Bluetooth, make sure it is <strong>connected and paired</strong></li>
                      <li>Try a different USB port or audio jack</li>
                      <li>Check your <strong>system sound settings</strong> to verify the mic is recognized</li>
                      <li><strong>Reload the page</strong> after connecting</li>
                    </ol>
                  </div>
                </>
              ) : isNoSpeech || isTimeout ? (
                <>
                  <p className="font-body text-sm text-muted leading-relaxed">
                    {isNoSpeech
                      ? 'Your microphone is working, but we did not detect any speech. Try these tips:'
                      : 'The recording ended before we could capture your voice. Try these tips:'}
                  </p>
                  <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-3">
                    <ol className="list-decimal list-inside text-sm font-body text-muted space-y-2 leading-relaxed">
                      <li>Make sure you are in a <strong>quiet environment</strong></li>
                      <li>Speak <strong>clearly and at normal volume</strong>, not too soft</li>
                      <li>Hold the device <strong>6-12 inches from your mouth</strong></li>
                      <li>Click the microphone button, then <strong>wait for the &quot;Listening...&quot; indicator</strong> before speaking</li>
                      <li>Try saying the word <strong>slowly and distinctly</strong></li>
                    </ol>
                  </div>
                </>
              ) : isPermissionDenied ? (
                <>
                  <p className="font-body text-sm text-muted leading-relaxed">
                    It looks like microphone access was denied. Follow these steps to enable it:
                  </p>

                  {/* Chrome / Edge instructions */}
                  <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-navy dark:text-white font-body font-semibold text-sm">
                      <Chrome size={16} className="text-teal" />
                      Chrome / Edge
                    </div>
                    <ol className="list-decimal list-inside text-sm font-body text-muted space-y-2 leading-relaxed">
                      <li>Click the <strong>lock icon</strong> (or tune icon) in the address bar</li>
                      <li>Find <strong>&quot;Microphone&quot;</strong> in the permissions list</li>
                      <li>Change it from &quot;Block&quot; to <strong>&quot;Allow&quot;</strong></li>
                      <li><strong>Reload the page</strong> and try again</li>
                    </ol>
                  </div>

                  {/* Safari instructions */}
                  <div className="bg-ice dark:bg-white/5 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-navy dark:text-white font-body font-semibold text-sm">
                      <Globe size={16} className="text-teal" />
                      Safari (Mac / iOS)
                    </div>
                    <ol className="list-decimal list-inside text-sm font-body text-muted space-y-2 leading-relaxed">
                      <li>Go to <strong>Safari &rarr; Settings &rarr; Websites &rarr; Microphone</strong></li>
                      <li>Find this website and set it to <strong>&quot;Allow&quot;</strong></li>
                      <li>On iOS: <strong>Settings &rarr; Safari &rarr; Microphone</strong> &rarr; Allow</li>
                      <li><strong>Reload the page</strong> and try again</li>
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body text-sm text-muted leading-relaxed">
                    When you click the microphone button, your browser will ask for permission.
                    Please tap <strong>&quot;Allow&quot;</strong> to enable speech recognition.
                  </p>

                  <div className="bg-ice dark:bg-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mic size={20} className="text-teal" />
                    </div>
                    <p className="text-sm font-body text-muted leading-relaxed">
                      Your voice data is processed locally in the browser and is <strong>never sent to our servers</strong>.
                      It is only used for real-time speech matching.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="bg-coral/10 rounded-xl px-4 py-3">
                      <p className="text-coral text-sm font-body">
                        Error: {errorMessage}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                {showRetryButton && (
                  <MagneticButton
                    onClick={() => { onClose(); onRetry?.(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal text-white font-body font-semibold py-3.5 rounded-xl"
                  >
                    <Mic size={16} />
                    Try Again
                  </MagneticButton>
                )}
                <MagneticButton
                  onClick={onClose}
                  className={`${showRetryButton ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 ${showRetryButton ? 'bg-ice dark:bg-white/10 text-navy dark:text-white' : 'bg-teal text-white'} font-body font-semibold py-3.5 rounded-xl`}
                >
                  {showRetryButton ? 'Close' : 'Got it'}
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
