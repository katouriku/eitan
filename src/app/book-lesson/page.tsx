"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Cookies from "js-cookie";
import "../globals.css";
import { useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Types for new schema
interface TimeRange {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}
interface WeeklyAvailability {
  day: string; // "monday", etc.
  ranges: TimeRange[];
}

function StripePaymentForm({ onSuccess, onError }: { clientSecret: string, onSuccess: () => void, onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!stripe || !elements) {
      setError("Stripeの初期化中です。しばらくお待ちください。");
      setLoading(false);
      return;
    }
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Optionally, you can set a return_url here for redirect after payment
      },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message || "支払いに失敗しました。");
      onError(result.error.message || "支払いに失敗しました。");
    } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setError("支払いの確認ができませんでした。");
      onError("支払いの確認ができませんでした。");
    }
    setLoading(false);
  };

  return (
    <form id="stripe-payment-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement
        options={{
          paymentMethodOrder: ["card", "konbini", "google_pay"],
          layout: "tabs",
        }}
      />
      {error && <div className="text-red-400 font-bold mt-2">{error}</div>}
      <button
        className="px-8 py-3 rounded-xl bg-green-500 text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300/50"
        type="submit"
        disabled={loading || !stripe || !elements}
      >
        {loading ? "処理中..." : "お支払いを確定する"}
      </button>
    </form>
  );
}

export default function BookLessonPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lessonType, setLessonType] = useState<"online" | "in-person" | "">("");
  const [participants, setParticipants] = useState(1);
  const paymentFormRef = useRef<HTMLDivElement>(null);

  const isLoading = !weeklyAvailability || weeklyAvailability.length === 0;

  useEffect(() => {
    async function fetchAvailability() {
      const data = await client.fetch(groq`*[_type == "availability"][0]{weeklyAvailability}`);
      setWeeklyAvailability(data?.weeklyAvailability || []);
    }
    fetchAvailability();
  }, []);

  // Try to load from cookies on mount
  useEffect(() => {
    const savedName = Cookies.get("booking_name") || "";
    const savedEmail = Cookies.get("booking_email") || "";
    const savedDate = Cookies.get("booking_date") || "";
    const savedTime = Cookies.get("booking_time") || "";
    // Prefill fields but do not auto-advance
    if (savedName) setSelectedDate(savedDate);
    if (savedEmail) setSelectedTime(savedTime);
  }, []);

  // Clear date and time cookies after booking confirmation
  useEffect(() => {
    if (step === 3) {
      Cookies.remove("booking_date");
      Cookies.remove("booking_time");
    }
  }, [step]);

  if (isLoading) {
    return (
      <main className="flex flex-col flex-1 min-w-0 w-full min-h-[100vh] pt-20">
        <div className="text-2xl text-gray-400">ロード中...</div>
      </main>
    );
  }

  // Helper: Map day string to JS weekday index
  const dayToIndex: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  // Generate available dates for next 30 days
  function getAvailableDates() {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = d.getDay();
      // Find if this weekday is available
      if (weeklyAvailability.some((a) => dayToIndex[a.day] === weekday)) {
        dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
      }
    }
    return dates;
  }

  // For a selected date, get all 1-hour slots from available ranges
  function getTimesForDate(date: string) {
    if (!date) return [];
    const d = new Date(date);
    const weekday = d.getDay();
    const avail = weeklyAvailability.find((a) => dayToIndex[a.day] === weekday);
    if (!avail) return [];
    const slots: string[] = [];
    for (const range of avail.ranges) {
      const [startHour, startMin] = range.start.split(":").map(Number);
      const [endHour, endMin] = range.end.split(":").map(Number);
      const current = new Date(d);
      current.setHours(startHour, startMin, 0, 0);
      const end = new Date(d);
      end.setHours(endHour, endMin, 0, 0);
      while (current < end) {
        const slot = current.toTimeString().slice(0, 5); // "HH:mm"
        slots.push(slot);
        current.setHours(current.getHours() + 1);
      }
    }
    return slots;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    if (!selectedDate || !selectedTime) {
      setFormError("Please select a date and time.");
      setFormLoading(false);
      return;
    }
    // Save to cookies
    const form = e.currentTarget as HTMLFormElement;
    const nameValue = (form.elements.namedItem("name") as HTMLInputElement)?.value || "";
    const emailValue = (form.elements.namedItem("email") as HTMLInputElement)?.value || "";
    Cookies.set("booking_name", nameValue, { expires: 7 });
    Cookies.set("booking_email", emailValue, { expires: 7 });
    Cookies.set("booking_date", selectedDate, { expires: 7 });
    Cookies.set("booking_time", selectedTime, { expires: 7 });
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonType, participants, currency: "jpy" }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep(2);
      } else {
        setFormError(data.error || "Failed to create payment session.");
      }
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }

  // Progress bar component
  function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
    // Fill only up to the current step: 0% (step 1), 50% (step 2), 100% (step 3)
    const percent = step === 1 ? 0 : step === 2 ? 50 : 100;
    // Helper to allow going back to previous steps
    const setStepIfAllowed = (target: 1 | 2 | 3) => {
      if (target < step) setStep(target);
    };
    return (
      <div className="w-full max-w-lg mx-auto mb-8 flex flex-col items-center">
        <div className="relative w-full h-8 bg-[#23232a] rounded-full overflow-visible flex items-center">
          <div
            className="absolute left-0 top-1/2 h-2 bg-[#3881ff] transition-all duration-300 rounded-full"
            style={{ width: `${percent}%`, transform: 'translateY(-50%)', zIndex: 1 }}
          />
          <div className="relative w-full flex justify-between items-center z-10">
            {[1, 2, 3].map((n, i) => {
              const isClickable = step > n;
              return (
                <div key={n} className={i === 1 ? "flex flex-col items-center w-1/3 justify-center" : "flex flex-col items-center w-0"} style={i === 0 ? {alignItems: 'flex-start'} : i === 2 ? {alignItems: 'flex-end'} : {}}>
                  {isClickable ? (
                    <button
                      type="button"
                      aria-label={`Go to step ${n}`}
                      tabIndex={0}
                      onClick={() => setStepIfAllowed(n as 1 | 2 | 3)}
                      className={
                        `w-9 h-9 flex items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3881ff] ` +
                        'bg-[#3881ff] border-[#3881ff] text-white hover:scale-105'
                      }
                      style={{ zIndex: 2 }}
                    >
                      {n}
                    </button>
                  ) : (
                    <div
                      className={
                        `w-9 h-9 flex items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200 ` +
                        (step > i ? 'bg-[#3881ff] border-[#3881ff] text-white' : step === i + 1 ? 'bg-[#23232a] border-[#3881ff] text-[#3881ff]' : 'bg-[#23232a] border-[#31313a] text-[#31313a]')
                      }
                      style={{ zIndex: 2 }}
                    >
                      {n}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Absolute-positioned labels for perfect centering */}
        <div className="relative w-full mt-3 h-6">
          {/* Info label */}
          {step > 1 ? (
            <button
              type="button"
              aria-label="Go to Info step"
              tabIndex={0}
              onClick={() => setStepIfAllowed(1)}
              className="absolute left-0 text-[#3881ff] hover:underline font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
              style={{ minWidth: 60, textAlign: 'center', transform: 'translateX(-50%)', left: 'calc(0% + 18px)' }}
            >
              予約情報
            </button>
          ) : (
            <span
              className={
                (step === 1 ? ' text-white' : '') +
                ' absolute left-0'
              }
              style={{ minWidth: 60, textAlign: 'center', transform: 'translateX(-50%)', left: 'calc(0% + 18px)' }}
            >
              予約情報
            </span>
          )}
          {/* Payment label */}
          {step > 2 ? (
            <button
              type="button"
              aria-label="Go to Payment step"
              tabIndex={0}
              onClick={() => setStepIfAllowed(2)}
              className="absolute left-1/2 text-[#3881ff] hover:underline font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
              style={{ minWidth: 60, textAlign: 'center', transform: 'translateX(-50%)' }}
            >
              支払い
            </button>
          ) : (
            <span
              className={
                (step === 2 ? ' text-white' : '') +
                ' absolute left-1/2'
              }
              style={{ minWidth: 60, textAlign: 'center', transform: 'translateX(-50%)' }}
            >
              支払い
            </span>
          )}
          {/* Done label (never clickable) */}
          <span
            className={
              (step === 3 ? ' text-white' : '') +
              ' absolute right-0'
            }
            style={{ minWidth: 60, textAlign: 'center', transform: 'translateX(50%)', right: 'calc(0% + 18px)' }}
          >
            確認
          </span>
        </div>
      </div>
    );
  }

  // Helper: Calculate price
  function getLessonPrice() {
    if (!lessonType) return 0;
    const base = lessonType === "in-person" ? 3000 : lessonType === "online" ? 2500 : 0;
    if (lessonType === "in-person") {
      return base + (participants - 1) * 1000;
    } else if (lessonType === "online") {
      return base + (participants - 1) * 500;
    }
    return base;
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 w-full">
      <section className="flex flex-col items-center justify-center w-full px-4">
        <div className="flex flex-col items-center justify-center max-w-2xl min-w-[340px] w-full order-2 md:order-none min-h-0">
          <span
            className="font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#3881ff] mb-8 text-center w-full"
            style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>
            レッスンを予約
          </span>
          {/* Price display, always visible */}
          <div className="w-full flex flex-col items-center mb-4">
            <div className="text-lg font-bold text-gray-200 flex flex-row items-center gap-4">
              <span>合計金額(税込み): <span className="text-[#3881ff] text-2xl font-extrabold">{getLessonPrice().toLocaleString()}円</span></span>
            </div>
            <div className="text-sm text-gray-400 mt-2 sm:mt-0 flex flex-row items-center">(参加者数: {participants}人)</div>
          </div>
          <ProgressBar step={step} />
          {step === 1 && lessonType === "" && (
            <div className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full border-2 border-[#3881ff] flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0 mb-8">
              <div className="text-lg text-gray-100 mb-4 text-center font-bold">レッスンの種類を選択してください</div>
              <button
                className="w-full px-6 py-4 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50 mb-4"
                onClick={() => setLessonType("online")}
              >
                オンラインレッスン
              </button>
              <button
                className="w-full px-6 py-4 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50"
                onClick={() => setLessonType("in-person")}
              >
                対面レッスン
              </button>
              <div className="text-xs text-gray-500 mt-2 text-center">※ 対面レッスンは美里町から30分以内の場所のみ対応しています。</div>
            </div>
          )}
          {step === 1 && lessonType !== "" && (
            <form className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full border-2 border-[#3881ff] flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0" onSubmit={async (e) => {
              await handleSubmit(e);
              setStep(2);
            }}>
              <input type="hidden" name="lessonType" value={lessonType} />
              {/* Participants selector */}
              <div className="flex flex-row items-center gap-4 mb-2">
                <label className="text-gray-200 font-bold">参加者数</label>
                <button type="button" className="px-3 py-1 rounded bg-[#23232a] text-[#3881ff] font-bold text-lg border border-[#3881ff] hover:bg-[#3881ff] hover:text-white transition-all" onClick={() => setParticipants(Math.max(1, participants - 1))}>-</button>
                <span className="text-lg font-bold text-gray-100 w-8 text-center">{participants}</span>
                <button type="button" className="px-3 py-1 rounded bg-[#23232a] text-[#3881ff] font-bold text-lg border border-[#3881ff] hover:bg-[#3881ff] hover:text-white transition-all" onClick={() => setParticipants(participants + 1)}>+</button>
              </div>
              <input type="hidden" name="participants" value={participants} />
              <input name="name" required placeholder="お名前" defaultValue={Cookies.get("booking_name") || ""} className="p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]" />
              <input name="email" required type="email" placeholder="メールアドレス" defaultValue={Cookies.get("booking_email") || ""} className="p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]" />
              <div>
                <label className="block text-gray-200 mb-2">予約日</label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                  }}
                  required
                  className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                >
                  <option value="">-- 日を選んでください --</option>
                  {getAvailableDates().map((date) => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-200 mb-2">予約時間</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                  disabled={!selectedDate}
                >
                  <option value="">-- 時間を選んでください --</option>
                  {getTimesForDate(selectedDate).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              {formError && <div className="text-red-400 font-bold">{formError}</div>}
              <button type="submit" className="mt-4 px-8 py-3 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50" disabled={formLoading}>
                {formLoading ? "ロード中..." : "支払いへ進む"}
              </button>
              <button type="button" className="mt-2 text-[#3881ff] underline text-sm" onClick={() => setLessonType("")}>戻る</button>
            </form>
          )}
          {step === 2 && clientSecret && (
            <div
              className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] overflow-y-auto justify-center"
              id="payment-form-container"
              ref={paymentFormRef}
              style={{ marginTop: 'auto', marginBottom: 'auto' }}
            >
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  locale: 'ja',
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#3881ff',
                      colorBackground: '#18181b',
                      colorText: '#fff',
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  clientSecret={clientSecret}
                  onSuccess={() => setStep(3)}
                  onError={msg => setFormError(msg)}
                />
              </Elements>
              {/* <button
                className="px-8 py-2 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50"
                onClick={() => setStep(3)}
              >
                Simulate Confirmation
              </button> */}
            </div>
          )}
          {step === 3 && (
            <div className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full flex flex-col items-center gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] justify-center">
              <svg className="w-16 h-16 text-green-400 mb-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-green-400 font-bold text-2xl mb-2">予約完了!</div>
              <div className="text-gray-300 text-center">
                ご予約ありがとうございます。<br />
                予約確認メールが間もなく送信されます。
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
