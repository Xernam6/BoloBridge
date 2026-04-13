'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ShimmerTextProps {
  text: string;
  duration?: number;
  delay?: number;
  repeat?: boolean;
  repeatDelay?: number;
  className?: string;
  spread?: number;
  color?: string;
  shimmerColor?: string;
}

export function ShimmerText({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  className,
  spread = 2,
  color,
  shimmerColor,
}: ShimmerTextProps) {
  const dynamicSpread = text.length * spread;

  return (
    <motion.span
      className={`relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent ${className}`}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          ...(color && { '--base-color': color }),
          ...(shimmerColor && { '--shimmer-color': shimmerColor }),
          backgroundImage: `linear-gradient(90deg,transparent calc(50% - var(--spread)),${shimmerColor || '#8B5CF6'},transparent calc(50% + var(--spread))), linear-gradient(${color || '#64748b'}, ${color || '#64748b'})`,
          backgroundRepeat: 'no-repeat, padding-box',
        } as React.CSSProperties
      }
      initial={{
        backgroundPosition: '100% center',
        opacity: 0,
      }}
      animate={{
        backgroundPosition: '0% center',
        opacity: 1,
      }}
      transition={{
        backgroundPosition: {
          repeat: repeat ? Infinity : 0,
          duration,
          delay,
          repeatDelay,
          ease: 'linear',
        },
        opacity: {
          duration: 0.3,
          delay,
        },
      }}
    >
      {text}
    </motion.span>
  );
}
