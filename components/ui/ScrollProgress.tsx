'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

interface ScrollProgressProps {
  /** Color class for the bar, e.g. "bg-teal" */
  className?: string;
}

export function ScrollProgress({ className = 'bg-teal' }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-[3px] z-[200] origin-left ${className}`}
      style={{ scaleX }}
    />
  );
}
