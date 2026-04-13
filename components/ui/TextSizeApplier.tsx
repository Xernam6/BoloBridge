'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

const SIZES = { 1: '14px', 2: '16px', 3: '18px' } as const;

export function TextSizeApplier() {
  const textSize = useAppStore((state) => state.textSize);
  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[textSize as keyof typeof SIZES] ?? '16px';
  }, [textSize]);
  return null;
}
