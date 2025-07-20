"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfilePictureProps {
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  className?: string;
}

export default function UserProfilePicture({ 
  size = 'md', 
  showDropdown = false,
  className = '' 
}: UserProfilePictureProps) {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // Get user avatar URL or use default
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー';
  const initials = displayName.charAt(0).toUpperCase();

  const ProfileImage = () => {
    if (avatarUrl && !imageError) {
      return (
        <Image
          src={avatarUrl}
          alt={`${displayName}のプロフィール写真`}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      );
    }
    
    // Default avatar with user's initial or default icon
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#3881ff] to-[#5a9eff] flex items-center justify-center text-white font-semibold shadow-lg`}>
        {user.user_metadata?.full_name ? (
          <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
            {initials}
          </span>
        ) : (
          <svg className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    );
  };

  if (!showDropdown) {
    return (
      <Link href="/profile" className={`block hover:opacity-80 transition-opacity ${className}`}>
        <ProfileImage />
      </Link>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
      >
        <ProfileImage />
        <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setDropdownOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-2"
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <ProfileImage />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="py-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  プロフィール・設定
                </div>
              </Link>
              
              <button
                onClick={async () => {
                  await signOut();
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ログアウト
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
