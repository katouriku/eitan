"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

interface HeaderProps {
  homepage: {
    mainTitle: string;
  };
  nav: Array<{
    label: string;
    href: string;
  }>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

// Hamburger menu icon component
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center w-6 h-6">
      <span className={`block h-0.5 w-5 bg-[#3881ff] rounded transition-all duration-200 ease-in-out ${
        open ? "rotate-45 translate-y-1.5" : ""
      }`} />
      <span className={`block h-0.5 w-5 bg-[#3881ff] rounded my-1 transition-all duration-200 ease-in-out ${
        open ? "opacity-0" : ""
      }`} />
      <span className={`block h-0.5 w-5 bg-[#3881ff] rounded transition-all duration-200 ease-in-out ${
        open ? "-rotate-45 -translate-y-1.5" : ""
      }`} />
    </div>
  );
}

export default function Header({ homepage, nav, menuOpen, setMenuOpen }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="w-full px-4 sm:px-6 py-3 bg-[var(--background)]/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-40 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#3881ff] hover:text-[#5a9eff] transition-colors"
                style={{textShadow:'0 2px 12px rgba(56,129,255,0.20)'}}>
              {homepage.mainTitle}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 xl:px-5 py-2.5 rounded-xl font-medium text-sm xl:text-base text-[var(--muted-foreground)] bg-[var(--muted)]/50 border border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[#3881ff]/90 hover:border-[#3881ff] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#3881ff]/30"
              >
                {item.label}
              </Link>
            ))}
            
            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)] hidden xl:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 rounded-xl font-medium text-sm bg-red-500/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all duration-300"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 xl:px-5 py-2.5 rounded-xl font-medium text-sm xl:text-base text-white bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] border border-[#3881ff]/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#3881ff]/30"
              >
                ログイン
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[var(--background)] border-l border-[var(--border)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#3881ff]">メニュー</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                aria-label="Close menu"
              >
                <HamburgerIcon open={true} />
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 rounded-xl font-medium text-[var(--muted-foreground)] bg-[var(--muted)]/50 border border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[#3881ff]/90 hover:border-[#3881ff] transition-all duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Auth Button */}
              {user ? (
                <div className="mt-4 space-y-3">
                  <div className="px-4 py-3 text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-xl">
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-xl font-medium bg-red-500/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all duration-300"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="mt-4 w-full px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] transition-all duration-300"
                >
                  ログイン
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
