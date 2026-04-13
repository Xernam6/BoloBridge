'use client';

import { motion } from 'framer-motion';

type ProgressBarSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  value: number;
  /** Show the percentage label */
  showLabel?: boolean;
  /** Size variant */
  size?: ProgressBarSize;
  /** Custom gradient class for the filled bar */
  gradient?: string;
  /** Additional class names for the outer container */
  className?: string;
  /** Accessible label for the progress bar */
  label?: string;
}

const sizeStyles: Record<ProgressBarSize, { track: string; label: string }> = {
  sm: { track: 'h-2', label: 'text-xs' },
  md: { track: 'h-3', label: 'text-sm' },
  lg: { track: 'h-5', label: 'text-sm' },
};

function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  gradient = 'from-cyan to-emerald-500',
  className = '',
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const { track, label: labelSize } = sizeStyles[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className={`flex justify-between items-center mb-1 ${labelSize}`}>
          {label && (
            <span className="font-medium text-body dark:text-white/70">{label}</span>
          )}
          <span className="font-semibold text-cyan ml-auto">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}

      <div
        className={`w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden ${track}`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps, ProgressBarSize };
