'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    // Render a placeholder with the same dimensions to prevent layout shift
    return <div className="w-10 h-10 p-2 rounded-full border border-transparent" />; 
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full bg-console-grey border border-gray-600 hover:border-neon-green transition-all shadow-lg backdrop-blur-sm"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Moon size={20} className="text-rush-purple" />
      ) : (
        <Sun size={20} className="text-orange-500" />
      )}
    </button>
  );
}