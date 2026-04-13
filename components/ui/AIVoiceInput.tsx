"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  className?: string;
  isRecording?: boolean;
  onToggle?: () => void;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  className,
  isRecording: externalRecording,
  onToggle,
}: AIVoiceInputProps) {
  const [internalRecording, setInternalRecording] = useState(false);
  const submitted = externalRecording ?? internalRecording;
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (submitted) {
      onStart?.();
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      if (time > 0) onStop?.(time);
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalRecording((prev) => !prev);
    }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            submitted
              ? "bg-gradient-to-br from-coral to-rose-500 shadow-lg shadow-coral/30"
              : "bg-gradient-to-br from-teal to-emerald-400 hover:shadow-lg hover:shadow-teal/30"
          )}
          type="button"
          onClick={handleClick}
        >
          {submitted ? (
            <div
              className="w-5 h-5 rounded-sm bg-white animate-spin"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            submitted
              ? "text-navy dark:text-white/70"
              : "text-muted dark:text-white/30"
          )}
        >
          {formatTime(time)}
        </span>

        <div className="h-8 w-72 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                submitted
                  ? "bg-gradient-to-t from-teal to-violet animate-pulse"
                  : "bg-gray-200 dark:bg-white/10 h-1"
              )}
              style={
                submitted && isClient
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="h-4 text-xs text-muted dark:text-white/50">
          {submitted ? "Listening..." : "Click to speak"}
        </p>
      </div>
    </div>
  );
}
