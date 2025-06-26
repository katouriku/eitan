"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // On mount, check localStorage or system preference
    const stored = localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="fixed bottom-6 right-6 z-50 bg-[#23232a] text-yellow-300 dark:text-blue-400 rounded-full shadow-lg p-3 border-2 border-[#a5b4fc] hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
      style={{ fontSize: 24 }}
    >
      {theme === "dark" ? "🌞" : "🌙"}
    </button>
  );
}
