'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // placeholder to avoid layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex items-center justify-center rounded-full p-2.5 text-sm 
                 font-medium transition-all duration-300 ease-snappy
                 bg-secondary/80 dark:bg-primary/10
                 hover:bg-primary/10 dark:hover:bg-primary/20
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                 w-9 h-9 shadow-sm dark:shadow-inner"
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span 
          className={`absolute inset-0 origin-center transition-all duration-300 ease-fluid
                    ${theme === 'dark' 
                      ? 'scale-100 opacity-100 rotate-0' 
                      : 'scale-0 opacity-0 rotate-45'}`}
        >
          <MoonIcon className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-50" />
        </span>
        <span 
          className={`absolute inset-0 origin-center transition-all duration-300 ease-fluid
                    ${theme === 'dark' 
                      ? 'scale-0 opacity-0 rotate-45' 
                      : 'scale-100 opacity-100 rotate-0'}`}
        >
          <SunIcon className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" />
        </span>
      </span>
      <span className="sr-only">
        {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      </span>
    </button>
  );
}
