'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  progress: number;
  speed: number;
  size: number;
  delay: number;
}

interface GradientDividerProps {
  className?: string;
  particleCount?: number;
  lineThickness?: number;
  particleSize?: number;
  animationDuration?: number;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function GradientDivider({
  className = '',
  particleCount = 8,
  lineThickness = 2,
  particleSize = 4,
  animationDuration = 3,
  gradientFrom = '#14B8A6',
  gradientVia = '#8B5CF6',
  gradientTo = '#7C3AED',
}: GradientDividerProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      progress: Math.random(),
      speed: 0.8 + Math.random() * 0.4,
      size: particleSize * (0.7 + Math.random() * 0.6),
      delay: (i / particleCount) * animationDuration,
    }));
    setParticles(newParticles);
  }, [particleCount, particleSize, animationDuration]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-px overflow-visible ${className}`}
    >
      {/* Gradient Line */}
      <motion.div
        className="absolute inset-0 w-full"
        style={{
          height: `${lineThickness}px`,
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
          boxShadow: `0 0 8px ${gradientVia}40, 0 0 16px ${gradientVia}20`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Animated Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, ${gradientVia}, ${gradientTo})`,
            boxShadow: `0 0 ${particle.size * 2}px ${gradientVia}, 0 0 ${particle.size * 4}px ${gradientVia}60`,
            top: '50%',
            left: '0%',
            y: '-50%',
          }}
          animate={{
            left: ['0%', '100%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: animationDuration * particle.speed,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Glow effect on line */}
      <motion.div
        className="absolute inset-0 w-full blur-sm"
        style={{
          height: `${lineThickness}px`,
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
          opacity: 0.5,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}
