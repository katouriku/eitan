"use client";

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === 'system') {
      // If currently system, switch to opposite of current resolved theme
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If manually set, cycle through: light -> dark -> system
      if (theme === 'light') {
        setTheme('dark');
      } else if (theme === 'dark') {
        setTheme('system');
      } else {
        setTheme('light');
      }
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L13.09 8.26L22 12L13.09 15.74L12 22L10.91 15.74L2 12L10.91 8.26L12 2Z" />
        </svg>
      );
    }
    
    if (resolvedTheme === 'dark') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
      );
    }
    
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12,18.5A6.5,6.5,0,1,1,18.5,12,6.51,6.51,0,0,1,12,18.5ZM12,7A5,5,0,1,0,17,12,5,5,0,0,0,12,7Z"/>
        <path d="M12,1a1,1,0,0,0-1,1V4a1,1,0,0,0,2,0V2A1,1,0,0,0,12,1Z"/>
        <path d="M12,20a1,1,0,0,0-1,1v2a1,1,0,0,0,2,0V21A1,1,0,0,0,12,20Z"/>
        <path d="M5.64,3.64a1,1,0,0,0-.71.29,1,1,0,0,0,0,1.41L6.34,6.75a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41L6.34,4A1,1,0,0,0,5.64,3.64Z"/>
        <path d="M16.25,17.66a1,1,0,0,0,1.41,0l1.41-1.41a1,1,0,0,0,0-1.41,1,1,0,0,0-1.41,0l-1.41,1.41A1,1,0,0,0,16.25,17.66Z"/>
        <path d="M1,11H4a1,1,0,0,0,0-2H1a1,1,0,0,0,0,2Z"/>
        <path d="M20,11h3a1,1,0,0,0,0-2H20a1,1,0,0,0,0,2Z"/>
        <path d="M6.34,17.66a1,1,0,0,0,0,1.41l1.41,1.41a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41L7.75,17.66A1,1,0,0,0,6.34,17.66Z"/>
        <path d="M16.25,6.34a1,1,0,0,0,1.41-1.41L16.25,3.52a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.41Z"/>
      </svg>
    );
  };

  const getLabel = () => {
    if (theme === 'system') return 'Auto';
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors duration-200 border border-[var(--border)] shadow-sm"
      title={`Current theme: ${getLabel()}. Click to cycle through themes.`}
    >
      {getIcon()}
      <span className="text-sm font-medium hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
