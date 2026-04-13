'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface NumberTickerProps {
  /** Target value to count up to */
  value: number;
  /** Duration in ms */
  duration?: number;
  /** Delay before starting (ms) */
  delay?: number;
  /** Format with locale separators (e.g. 1,250) */
  formatLocale?: boolean;
  /** Suffix appended after number (e.g. "%" or " XP") */
  suffix?: string;
  /** Prefix before number (e.g. "+" or "$") */
  prefix?: string;
  className?: string;
}

export function NumberTicker({
  value,
  duration = 1200,
  delay = 0,
  formatLocale = true,
  suffix = '',
  prefix = '',
  className = '',
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const timeout = setTimeout(() => {
      const start = performance.now();

      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, value, duration, delay]);

  const formatted = formatLocale ? display.toLocaleString() : String(display);

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
