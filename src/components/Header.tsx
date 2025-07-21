"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import UserProfilePicture from './UserProfilePicture';

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
          <Link href="/" className="flex-shrink-0 z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#3881ff] hover:text-[#5a9eff] transition-colors"
                style={{textShadow:'0 2px 12px rgba(56,129,255,0.20)'}}>
              {homepage.mainTitle}
            </h1>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 absolute left-1/2 transform -translate-x-1/2 z-10">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 xl:px-5 py-2.5 rounded-xl font-medium text-sm xl:text-base text-[var(--foreground)] hover:text-[#3881ff] hover:bg-[var(--muted)]/40 transition-all duration-300 group"
              >
                <span className="relative z-10">{item.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3881ff]/5 to-[#5a9eff]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] rounded-full group-hover:w-4/5 transition-all duration-300"></div>
              </Link>
            ))}
          </nav>
            
          {/* Auth Section - Right */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0 z-20">
            {user ? (
              <UserProfilePicture showDropdown={true} />
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="relative px-5 xl:px-6 py-2.5 rounded-xl font-semibold text-sm xl:text-base text-white bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-[#3881ff]/40 hover:-translate-y-0.5 transform"
              >
                ログイン
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors flex-shrink-0 z-20"
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
                  className="relative px-4 py-3 rounded-xl font-medium text-[var(--foreground)] hover:text-[#3881ff] hover:bg-[var(--muted)]/40 transition-all duration-300 group"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="relative z-10">{item.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3881ff]/10 to-[#5a9eff]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              {user ? (
                <div className="mt-4 space-y-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-[var(--foreground)] bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl hover:bg-[var(--muted)] transition-all duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserProfilePicture size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.user_metadata?.full_name || 'ユーザー'}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
                    </div>
                  </Link>
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
                  className="mt-4 w-full px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] transition-all duration-300 shadow-md hover:shadow-lg"
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
