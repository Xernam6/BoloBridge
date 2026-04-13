'use client';

import { motion } from 'framer-motion';

interface ProgressRingProps {
  /** 0–100 */
  progress: number;
  /** Ring diameter in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Color of the filled arc — Tailwind class like "text-success" */
  className?: string;
  /** Show the percentage label inside */
  showLabel?: boolean;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  className = 'text-success',
  showLabel = false,
  delay = 0,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate/10 dark:text-white/10"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className={className}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay }}
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center font-body text-[10px] font-semibold text-navy dark:text-white">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
