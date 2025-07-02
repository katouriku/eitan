import React, { createContext, useContext, useState } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';

/**
 * Global Loading Context
 * 
 * Provides app-wide loading state management. Use this for:
 * - Navigation between pages
 * - Global API calls that should block the entire UI
 * - Long-running operations that affect the whole app
 * 
 * For page-specific loading, prefer using the LoadingAnimation component directly.
 * 
 * Usage:
 * ```tsx
 * const { showLoadingWithMessage, hideLoading } = useLoading();
 * 
 * // Show loading
 * showLoadingWithMessage("カスタムメッセージ", "サブメッセージ");
 * 
 * // Hide loading
 * hideLoading();
 * ```
 */

interface LoadingContextType {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  showLoadingWithMessage: (message?: string, submessage?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>();
  const [loadingSubmessage, setLoadingSubmessage] = useState<string>();

  const setGlobalLoading = (loading: boolean) => {
    setIsGlobalLoading(loading);
    if (!loading) {
      setLoadingMessage(undefined);
      setLoadingSubmessage(undefined);
    }
  };

  const showLoadingWithMessage = (message?: string, submessage?: string) => {
    setLoadingMessage(message);
    setLoadingSubmessage(submessage);
    setIsGlobalLoading(true);
  };

  const hideLoading = () => {
    setGlobalLoading(false);
  };

  return (
    <LoadingContext.Provider 
      value={{ 
        isGlobalLoading, 
        setGlobalLoading, 
        showLoadingWithMessage, 
        hideLoading 
      }}
    >
      {isGlobalLoading && (
        <LoadingAnimation 
          message={loadingMessage} 
          submessage={loadingSubmessage}
          fullScreen={true} 
        />
      )}
      {!isGlobalLoading && children}
    </LoadingContext.Provider>
  );
}
