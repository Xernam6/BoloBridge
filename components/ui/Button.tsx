'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'className'>,
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'form'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-teal text-white shadow-md hover:shadow-lg dark:shadow-teal/20',
  secondary:
    'border-2 border-teal text-teal bg-transparent hover:bg-teal/5 dark:hover:bg-teal/10',
  ghost:
    'text-body bg-transparent hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/5',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-lg rounded-xl gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      className = '',
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-semibold
          transition-colors duration-200 cursor-pointer
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
