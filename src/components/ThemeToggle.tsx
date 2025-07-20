"use client";

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, isHydrated } = useTheme();

  const handleToggle = () => {
    // Simply toggle between light and dark
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getIcon = () => {
    return theme === 'dark' ? '🌙' : '☀️';
  };

  // Render a generic button during SSR to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--card)] border-2 border-[var(--border)] text-2xl flex items-center justify-center hover:bg-[var(--muted)] transition-all duration-200 shadow-lg"
        disabled
      >
        ☀️
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--card)] border-2 border-[var(--border)] text-2xl flex items-center justify-center hover:bg-[var(--muted)] transition-all duration-200 shadow-lg hover:scale-105 hover:shadow-xl"
      title={`Current theme: ${theme === 'dark' ? 'Dark' : 'Light'}. Click to toggle theme.`}
    >
      {getIcon()}
    </button>
  );
}
