'use client';

import React from 'react';
import { useTheme } from 'next-themes';

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <label className="relative inline-block w-[3.5em] h-[2em] cursor-pointer" aria-label="Toggle dark mode">
      <input
        type="checkbox"
        className="peer opacity-0 w-0 h-0"
        checked={isDark}
        onChange={() => setTheme(isDark ? 'light' : 'dark')}
      />
      <span
        className="absolute inset-0 cursor-pointer rounded-[30px] transition duration-500 bg-slate-200 peer-checked:bg-slate-300 dark:bg-[#2D3142] dark:peer-checked:bg-[#3d4258] before:content-[''] before:absolute before:h-[1.4em] before:w-[1.4em] before:rounded-full before:left-[10%] before:bottom-[15%] before:shadow-[inset_8px_-4px_0px_0px_#C2956B] before:bg-slate-200 dark:before:bg-[#2D3142] before:transition before:duration-500 peer-checked:before:translate-x-full peer-checked:before:shadow-[inset_15px_-4px_0px_15px_#C2956B]"
      />
    </label>
  );
};

export default DarkModeToggle;
