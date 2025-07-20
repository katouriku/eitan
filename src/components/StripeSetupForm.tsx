"use client";

import { useState } from 'react';
import { 
  useStripe, 
  useElements, 
  PaymentElement 
} from '@stripe/react-stripe-js';

interface StripeSetupFormProps {
  setupClientSecret?: string;
  paymentClientSecret?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onBack: () => void;
  savePaymentMethod?: boolean;
}

export default function StripeSetupForm({
  setupClientSecret,
  paymentClientSecret,
  onSuccess,
  onError,
  onBack,
  savePaymentMethod = false
}: StripeSetupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(savePaymentMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      if (setupClientSecret) {
        // Handle setup intent for saving payment method
        const { error } = await stripe.confirmSetup({
          elements,
          clientSecret: setupClientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/setup-complete`,
          },
          redirect: 'if_required',
        });

        if (error) {
          onError(error.message || 'カードの保存に失敗しました。');
        } else {
          onSuccess();
        }
      } else if (paymentClientSecret) {
        // Handle payment intent
        if (saveForFuture) {
          // Save payment method during payment
          const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: paymentClientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/payment-complete`,
              setup_future_usage: 'off_session',
            },
            redirect: 'if_required',
          });

          if (error) {
            onError(error.message || '決済に失敗しました。');
          } else {
            onSuccess();
          }
        } else {
          // Regular payment without saving
          const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: paymentClientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/payment-complete`,
            },
            redirect: 'if_required',
          });

          if (error) {
            onError(error.message || '決済に失敗しました。');
          } else {
            onSuccess();
          }
        }
      }
    } catch (err) {
      console.error('Stripe error:', err);
      onError('決済処理でエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const isSetupMode = !!setupClientSecret;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-[var(--foreground)] font-semibold mb-4">
          {isSetupMode ? 'カード情報を入力してください' : '決済情報'}
        </label>
        <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
          <PaymentElement 
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  name: '',
                }
              }
            }}
          />
        </div>
      </div>

      {!isSetupMode && !savePaymentMethod && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="save-card"
            checked={saveForFuture}
            onChange={(e) => setSaveForFuture(e.target.checked)}
            className="rounded border-[var(--border)] text-[#3881ff] focus:ring-[#3881ff] focus:ring-offset-0"
          />
          <label htmlFor="save-card" className="text-sm text-[var(--foreground)] cursor-pointer">
            次回のお支払いのためにカード情報を保存する
          </label>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
        >
          戻る
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {isSetupMode ? 'カード保存中...' : '決済処理中...'}
            </div>
          ) : (
            isSetupMode ? 'カードを保存' : '決済を完了'
          )}
        </button>
      </div>
    </form>
  );
}
