'use client';

import { motion } from 'framer-motion';

interface MarqueeProps {
  text: string;
  repeat?: number;
  duration?: number;
  className?: string;
  strokeWidth?: string;
}

export function Marquee({
  text,
  repeat = 4,
  duration = 20,
  className,
  strokeWidth = '1px',
}: MarqueeProps) {
  return (
    <div className={`relative w-full overflow-hidden py-12 ${className ?? ''}`}>
      <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-cream dark:from-cloud to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-cream dark:from-cloud to-transparent z-10" />
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
        }}
      >
        {[...Array(repeat)].map((_, i) => (
          <div key={i} className="flex items-center mx-4">
            <span
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-heading font-bold text-transparent px-4 marquee-stroke"
            >
              {text}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
