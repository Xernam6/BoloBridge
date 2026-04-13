'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

type CardVariant = 'default' | 'glass' | 'game';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'className'> {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  /** Optional header text for the "game" variant gradient header */
  headerTitle?: string;
  /** Optional custom gradient for the "game" variant header */
  headerGradient?: string;
}

const baseStyles =
  'rounded-2xl p-6 transition-shadow duration-300';

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-white shadow-lg border border-gray-100',
  glass:
    'backdrop-blur-xl bg-white/15 border border-white/20 shadow-lg',
  game:
    'bg-white shadow-lg border border-gray-100 overflow-hidden',
};

function Card({
  variant = 'default',
  children,
  className = '',
  headerTitle,
  headerGradient = 'from-cyan to-grape',
  ...rest
}: CardProps) {
  return (
    <motion.div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={{
        y: -2,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...rest}
    >
      {variant === 'game' && (
        <div
          className={`bg-gradient-to-r ${headerGradient} -mx-6 -mt-6 mb-4 px-6 py-3`}
        >
          {headerTitle && (
            <h3 className="text-white font-heading font-bold text-lg">
              {headerTitle}
            </h3>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export { Card };
export type { CardProps, CardVariant };
