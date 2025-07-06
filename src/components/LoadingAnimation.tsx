import React from 'react';

/**
 * A beautiful loading animation component with dual spinning rings and animated dots
 * that matches the site's blue color scheme (#3881ff, #5a9eff).
 * 
 * @param message - Main loading message (default: "データを読み込み中")
 * @param submessage - Secondary message (default: "しばらくお待ちください...")
 * @param fullScreen - Whether to render as full screen or inline (default: true)
 * 
 * This component can be used:
 * 1. Locally in pages for page-specific loading (recommended for most cases)
 * 2. Via the global LoadingContext for app-wide loading states
 * 3. Inline in components with fullScreen=false
 */
interface LoadingAnimationProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export default function LoadingAnimation({ 
  message = "データを読み込み中", 
  submessage = "しばらくお待ちください...",
  fullScreen = true 
}: LoadingAnimationProps) {
  if (fullScreen) {
    // Full screen overlay that doesn't affect layout
    return (
      <div className="fixed inset-0 bg-[var(--background)] z-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Loading spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[var(--muted)] border-t-[#3881ff] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-[#5a9eff] rounded-full animate-spin animation-delay-150"></div>
          </div>
          
          {/* Loading text */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">{message}</h2>
            <p className="text-[var(--muted-foreground)]">{submessage}</p>
          </div>
          
          {/* Loading dots animation */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-[#3881ff] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#3881ff] rounded-full animate-pulse animation-delay-200"></div>
            <div className="w-2 h-2 bg-[#3881ff] rounded-full animate-pulse animation-delay-400"></div>
          </div>
        </div>
      </div>
    );
  }

  // Inline loading for smaller components
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      {/* Loading spinner */}
      <div className="relative">
        <div className="w-12 h-12 border-4 border-[var(--muted)] border-t-[#3881ff] rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-[#5a9eff] rounded-full animate-spin animation-delay-150"></div>
      </div>
      
      {/* Loading text */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">{message}</h2>
        <p className="text-[var(--muted-foreground)] text-sm">{submessage}</p>
      </div>
      
      {/* Loading dots animation */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-[#3881ff] rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-[#3881ff] rounded-full animate-pulse animation-delay-200"></div>
        <div className="w-2 h-2 bg-[#3881ff] rounded-full animate-pulse animation-delay-400"></div>
      </div>
    </div>
  );
}
