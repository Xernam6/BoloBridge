'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
  showRadialGradient?: boolean;
}

/**
 * A warm, organic aurora background using CSS repeating-linear-gradient
 * with animated background-position. Colors shifted to warm sage/camel/lavender
 * for the calm BoloBridge aesthetic.
 */
export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={`relative flex flex-col min-h-screen items-center justify-center transition-colors ${className ?? ''}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-[-10px] opacity-40 will-change-transform"
          style={
            {
              '--purple': '#5C4D9A',
              '--lavender': '#8B7EC8',
              '--camel': '#C2956B',
              '--warm-light': '#D4A373',
              '--muted-plum': '#6B5B95',
              backgroundImage: `
                repeating-linear-gradient(100deg,
                  var(--purple) 10%,
                  var(--muted-plum) 15%,
                  var(--lavender) 20%,
                  var(--warm-light) 25%,
                  var(--purple) 30%)
              `,
              backgroundSize: '300% 200%',
              filter: 'blur(60px) saturate(0.8)',
            } as React.CSSProperties
          }
          animate={{
            backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'],
          }}
          transition={{
            duration: 20,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'mirror' as const,
          }}
        />

        {/* Secondary subtle layer */}
        <motion.div
          className="absolute inset-[-10px] opacity-20 will-change-transform mix-blend-soft-light"
          style={
            {
              backgroundImage: `
                repeating-linear-gradient(100deg,
                  rgba(92,77,154,0.1) 0%,
                  rgba(92,77,154,0.1) 7%,
                  transparent 10%,
                  transparent 12%,
                  rgba(92,77,154,0.1) 16%),
                repeating-linear-gradient(100deg,
                  #5C4D9A 10%,
                  #6B5B95 15%,
                  #8B7EC8 20%,
                  #C2956B 25%,
                  #5C4D9A 30%)
              `,
              backgroundSize: '200%, 100%',
              backgroundPosition: '50% 50%, 50% 50%',
            } as React.CSSProperties
          }
          animate={{
            backgroundPosition: [
              '50% 50%, 50% 50%',
              '100% 50%, 150% 50%',
              '50% 50%, 50% 50%',
            ],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Vignette */}
      {showRadialGradient && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
          }}
        />
      )}

      {children}
    </div>
  );
}
