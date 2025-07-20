"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

function ResetPasswordForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [preventRedirect, setPreventRedirect] = useState(true); // Prevent automatic redirects
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Disable automatic redirects when user becomes authenticated from email
  useEffect(() => {
    if (user && searchParams.get('from') === 'email') {
      setPreventRedirect(true);
    }
  }, [user, searchParams]);

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        // Check if we came from an email link
        const fromEmail = searchParams.get('from') === 'email';
        
        // Check if user is authenticated
        if (!user) {
          setIsValidSession(false);
          setCheckingSession(false);
          return;
        }

        if (fromEmail) {
          // If coming from email, we should have a valid session for password reset
          setIsValidSession(true);
        } else {
          // If not from email, redirect to login
          router.push('/');
          return;
        }
        
        setCheckingSession(false);
      } catch (err) {
        console.error('Session validation failed:', err);
        setError('Session validation failed');
        setCheckingSession(false);
      }
    };

    checkPasswordResetSession();
  }, [user, router, searchParams]);

  // Auto-redirect after successful password reset (but not when preventRedirect is true)
  useEffect(() => {
    if (user && isValidSession && !preventRedirect && !checkingSession) {
      if (!preventRedirect) {
        const redirectTimeout = setTimeout(() => {
          router.push('/');
        }, 5000); // Extended to 5 seconds

        return () => clearTimeout(redirectTimeout);
      }
    }
  }, [user, isValidSession, preventRedirect, checkingSession, router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('パスワード変更完了!');
        // Allow redirect after successful password update and actually trigger it
        setPreventRedirect(false);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">セッションを確認中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            無効なリセットリンク
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            このパスワードリセットリンクは無効または期限切れです。新しいリンクをリクエストしてください。
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            パスワード変更
          </h1>
          <p className="text-[var(--muted-foreground)]">
            新しいパスワードを入力してください
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-lg mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              新しいパスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] transition-all"
                placeholder="新しいパスワードを入力してください"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <Image 
                  src={showPassword ? "/eye-off.svg" : "/eye-show.svg"} 
                  alt={showPassword ? "パスワードを隠す" : "パスワードを表示"} 
                  className="w-5 h-5" 
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              新しいパスワードをご確認ください
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] transition-all"
                placeholder="パスワードを再度入力してください"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <Image 
                  src={showConfirmPassword ? "/eye-off.svg" : "/eye-show.svg"} 
                  alt={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"} 
                  className="w-5 h-5" 
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                パスワードを更新中...
              </>
            ) : (
              'パスワードを更新'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            ← ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3881ff] mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">読み込み中...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
