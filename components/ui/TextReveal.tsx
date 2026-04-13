'use client';

import { type FC, type ReactNode, useRef } from 'react';
import { motion, type MotionValue, useScroll, useTransform } from 'framer-motion';

interface TextRevealByWordProps {
  text: string;
  className?: string;
}

const Word: FC<{
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative mx-1 lg:mx-2.5 xl:mx-3">
      <span className="absolute opacity-20">{children}</span>
      <motion.span style={{ opacity }} className="text-navy dark:text-white">
        {children}
      </motion.span>
    </span>
  );
};

export function TextRevealByWord({ text, className }: TextRevealByWordProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const words = text.split(' ');

  return (
    <div ref={targetRef} className={`relative z-0 h-[200vh] ${className ?? ''}`}>
      <div className="sticky top-0 mx-auto flex h-[50%] max-w-4xl items-center bg-transparent px-4 py-20">
        <p className="flex flex-wrap p-5 font-heading text-2xl font-bold text-navy/20 dark:text-white/20 md:p-8 md:text-3xl lg:p-10 lg:text-4xl xl:text-5xl">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </div>
  );
}
