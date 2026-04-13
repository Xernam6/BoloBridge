'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ children, content, side = 'top', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const isTop = side === 'top';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: isTop ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isTop ? 4 : -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute z-50 pointer-events-none ${
              isTop ? 'bottom-full mb-2' : 'top-full mt-2'
            } left-1/2 -translate-x-1/2 ${className}`}
          >
            <div className="bg-[#2D3142] text-white dark:bg-[#FAF8F5] dark:text-[#2D3142] text-xs font-body px-3 py-2 rounded-xl shadow-lg whitespace-nowrap relative">
              {content}
              {/* Arrow / caret */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
                  isTop
                    ? 'top-full border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#2D3142] dark:border-t-[#FAF8F5]'
                    : 'bottom-full border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-[#2D3142] dark:border-b-[#FAF8F5]'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
