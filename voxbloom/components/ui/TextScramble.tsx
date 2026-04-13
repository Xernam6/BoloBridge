'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

interface TextScrambleProps {
  /** The final text to reveal */
  text: string;
  /** Duration of the full scramble in ms */
  duration?: number;
  /** Delay before starting (ms) */
  delay?: number;
  /** Trigger only once when in view */
  once?: boolean;
  className?: string;
}

export function TextScramble({
  text,
  duration = 800,
  delay = 0,
  once = true,
  className = '',
}: TextScrambleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: '-40px' });
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!inView) return;

    const timeout = setTimeout(() => {
      const length = text.length;
      const stepTime = duration / length;
      let revealed = 0;

      const interval = setInterval(() => {
        revealed++;
        setDisplay(
          text.slice(0, revealed) +
            Array.from({ length: length - revealed }, () =>
              CHARS[Math.floor(Math.random() * CHARS.length)]
            ).join('')
        );

        if (revealed >= length) {
          clearInterval(interval);
          setDisplay(text);
        }
      }, stepTime);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, text, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
