'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex items-center gap-3 w-full rounded-2xl px-4 py-3 shadow-lg border font-body text-sm bg-white dark:bg-[#1E1E36] border-teal/10 text-navy dark:text-white',
          title: 'font-medium text-sm',
          description: 'text-xs text-slate/60',
          success: 'border-success/20 [&>svg]:text-success',
          error: 'border-coral/20 [&>svg]:text-coral',
          info: 'border-teal/20 [&>svg]:text-teal',
        },
      }}
    />
  );
}
