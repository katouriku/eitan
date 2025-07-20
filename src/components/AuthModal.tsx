"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signUp, signIn, resetPassword } = useAuth();

  if (!isOpen) return null;

  // Show password reset screen
  if (showPasswordReset) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              パスワードリセット
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setMessage('');
            
            const { error } = await resetPassword(email);
            if (error) {
              setMessage(error.message);
            } else {
              setMessage('パスワードリセットメールを送信しました。メールをご確認ください。');
            }
            setLoading(false);
          }} className="space-y-4">
            <p className="text-[var(--muted-foreground)] text-sm mb-4">
              登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
            </p>
            
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                メールアドレス
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                placeholder="name@gmail.com"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${
                message.includes('送信しました')
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? '送信中...' : 'リセットメールを送信'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowPasswordReset(false);
                setMessage('');
              }}
              className="text-sm text-[#3881ff] hover:text-[#5a9eff] transition-colors"
            >
              ← ログイン画面に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation screen after successful sign up
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-xl">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                確認メールを送信しました
              </h2>
              <p className="text-[var(--muted-foreground)] mb-4">
                <span className="font-medium">{email}</span> 宛に確認メールを送信しました。
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                メール内のリンクをクリックしてアカウントを有効化してください。
                その後、こちらからログインできます。
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setIsSignUp(false);
                  setEmail('');
                  setPassword('');
                  setMessage('');
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300"
              >
                ログイン画面へ
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          full_name: fullName,
          preferred_location: preferredLocation
        });
        if (error) {
          setMessage(error.message);
        } else {
          // Show confirmation screen instead of error-like message
          setShowConfirmation(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setMessage(error.message);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setMessage('エラーが発生しました。');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            {isSignUp ? 'アカウント登録' : 'ログイン'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
              placeholder="name@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
              placeholder="6文字以上"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label htmlFor="preferredLocation" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  希望レッスン場所
                </label>
                <input
                  id="preferredLocation"
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                  placeholder="例: 東京都渋谷区渋谷1-1-1 または オンライン"
                />
              </div>
            </>
          )}

          {message && (
            <div className="p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? '処理中...' : isSignUp ? '登録' : 'ログイン'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {!isSignUp && (
            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              className="text-sm text-[var(--muted-foreground)] hover:text-[#3881ff] transition-colors"
            >
              パスワードを忘れた方はこちら
            </button>
          )}
          
          <div>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#3881ff] hover:text-[#5a9eff] transition-colors"
            >
              {isSignUp ? 'ログイン' : '登録'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
