"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import Cookies from "js-cookie";
import "../globals.css";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { useQueryParam } from "./useQueryParam";
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
  const [step, setStepState] = useState<1 | 2 | 3>(1);
  const [lessonType, setLessonType] = useState<"online" | "in-person" | "">("");
  const [participants, setParticipants] = useState(1);
  const [showParticipantWarning, setShowParticipantWarning] = useState(false);
  const paymentFormRef = useRef<HTMLDivElement>(null);
  const lessonTypeParam = useQueryParam("lessonType");

  // Coupon state
  const [coupon, setCoupon] = useState("");
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [couponConfirmed, setCouponConfirmed] = useState(false);

  // Only update price when coupon is confirmed
  async function updatePrice(lessonType: string, participants: number, coupon: string) {
    setPriceLoading(true);
    setPriceError(null);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonType, participants, currency: "jpy", coupon }),
      });
      const data = await res.json();
      if (typeof data.finalAmount === "number") {
        setFinalPrice(data.finalAmount);
      } else {
        setFinalPrice(null);
      }
      if (data.error) setPriceError(data.error);
      else setPriceError(null);
    } catch {
      setPriceError("価格の取得に失敗しました。");
      setFinalPrice(null);
    } finally {
      setPriceLoading(false);
    }
  }

  // Update price when lessonType/participants change or coupon is confirmed
  useEffect(() => {
    if (lessonType && participants && couponConfirmed) {
      updatePrice(lessonType, participants, coupon);
    } else if (lessonType && participants && !couponConfirmed) {
      // If coupon not confirmed, show base price
      setFinalPrice(null);
      setPriceError(null);
    }
  }, [lessonType, participants, couponConfirmed]);

  // Reset coupon confirmation if coupon input changes
  useEffect(() => {
    setCouponConfirmed(false);
    setPriceError(null);
  }, [coupon]);

  const isLoading = !weeklyAvailability || weeklyAvailability.length === 0;

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/availability');
        if (!res.ok) {
          console.error('API error:', res.status, await res.text());
          setWeeklyAvailability([]);
          return;
        }
        const data = await res.json();
        console.log('API /api/availability response:', data);
        setWeeklyAvailability(data.weeklyAvailability || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setWeeklyAvailability([]);
      }
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

  // If lessonType is provided in the query, set it and skip selection
  useEffect(() => {
    if (lessonTypeParam === "online" || lessonTypeParam === "in-person") {
      setLessonType(lessonTypeParam);
      setStep(1); // Always go to booking form step if param is present
    }
  }, [lessonTypeParam, lessonType]);

  // Hide warning when participants is reduced
  useEffect(() => {
    if (participants < 5 && showParticipantWarning) {
      setShowParticipantWarning(false);
    }
  }, [participants, showParticipantWarning]);

  // Sync step with browser history
  function setStep(newStep: 1 | 2 | 3) {
    setStepState(newStep);
    window.history.pushState({ step: newStep }, '', `?step=${newStep}`);
  }

  // On mount, set step from URL or history
  useEffect(() => {
    const urlStep = Number(new URL(window.location.href).searchParams.get('step'));
    if (urlStep === 2 || urlStep === 3) {
      setStepState(urlStep as 1 | 2 | 3);
    }
    // Listen for popstate
    const onPopState = (e: PopStateEvent) => {
      const s = e.state?.step;
      if (s === 1 || s === 2 || s === 3) {
        setStepState(s);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

  // Helper: Check if a date is fully booked
  function isDateFullyBooked(date: string) {
    const d = new Date(date);
    const weekday = d.getDay();
    const avail = weeklyAvailability.find((a) => dayToIndex[a.day] === weekday);
    if (!avail) return false;
    let totalSlots = 0;
    const slotStarts: string[] = [];
    for (const range of avail.ranges) {
      const [startHour] = range.start.split(":").map(Number);
      const [endHour] = range.end.split(":").map(Number);
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = hour.toString().padStart(2, '0') + ":00";
        slotStarts.push(slotStart);
        totalSlots++;
      }
    }
    const booked = allBookedSlots[date] || [];
    return slotStarts.every(slot => booked.includes(slot)) && totalSlots > 0;
  }

  // --- New: Fetch all booked slots for the next 30 days ---
  const [allBookedSlots, setAllBookedSlots] = useState<Record<string, string[]>>({}); // { 'YYYY-MM-DD': ['HH:mm', ...] }
  useEffect(() => {
    async function fetchAllBooked() {
      const today = new Date();
      const start = today.toISOString().slice(0, 10);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 29);
      const end = endDate.toISOString().slice(0, 10);
      const res = await fetch(`/api/booking?start=${start}&end=${end}`);
      const data = await res.json();
      // Group by date
      const grouped: Record<string, string[]> = {};
      if (Array.isArray(data.bookings)) {
        for (const b of data.bookings) {
          const d = new Date(b.date);
          // Use local time for date and time string
          const dateStr = d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
          const timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
          if (!grouped[dateStr]) grouped[dateStr] = [];
          grouped[dateStr].push(timeStr);
        }
      }
      setAllBookedSlots(grouped);
    }
    fetchAllBooked();
  }, []);

  // For a selected date, get all 1-hour slots from available ranges
  function getTimesForDate(date: string) {
    if (!date) return [];
    const d = new Date(date);
    const weekday = d.getDay();
    const avail = weeklyAvailability.find((a) => {
      const idx = dayToIndex[a.day];
      return idx === weekday;
    });
    if (!avail) return [];
    const slots: { label: string, value: string, disabled: boolean }[] = [];
    const booked = allBookedSlots[date] || [];
    for (const range of avail.ranges) {
      const [startHour] = range.start.split(":").map(Number);
      const [endHour] = range.end.split(":").map(Number);
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = hour.toString().padStart(2, '0') + ":00";
        const slotEnd = (hour + 1).toString().padStart(2, '0') + ":00";
        const isBooked = booked.includes(slotStart);
        slots.push({
          label: `${slotStart} - ${slotEnd}` + (isBooked ? '（予約済み）' : ''),
          value: `${slotStart} - ${slotEnd}`,
          disabled: isBooked
        });
      }
    }
    return slots;
  }

  // All hooks must be at the top level
  const getLessonPrice = useCallback(() => {
    if (!lessonType) return 0;
    const base = lessonType === "in-person" ? 3000 : lessonType === "online" ? 2500 : 0;
    if (lessonType === "in-person") {
      return base + (participants - 1) * 1000;
    } else if (lessonType === "online") {
      return base + (participants - 1) * 500;
    }
    return base;
  }, [lessonType, participants]);

  // Only send booking email after payment or free booking is confirmed
  async function sendBookingEmail({ name, email, kana, date, duration, details }: { name: string, email: string, kana: string, date: string, duration: number, details: string }) {
    // Calculate price breakdown for email
    const lessonTypeValue = lessonType;
    const participantsValue = participants;
    let regularPrice = 0;
    if (lessonTypeValue === "in-person") {
      regularPrice = 3000 + (participantsValue - 1) * 1000;
    } else if (lessonTypeValue === "online") {
      regularPrice = 2500 + (participantsValue - 1) * 500;
    }
    const couponValue = couponConfirmed ? coupon : undefined;
    const computedFinalPrice = finalPrice !== null ? finalPrice : regularPrice;
    const discountAmount = couponConfirmed && regularPrice > computedFinalPrice ? regularPrice - computedFinalPrice : 0;
    try {
      // Now POST to /api/book-lesson will save to DB and send email
      const bookingRes = await fetch("/api/book-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          kana,
          date,
          duration,
          details,
          lessonType: lessonTypeValue,
          participants: participantsValue,
          coupon: couponValue,
          regularPrice,
          discountAmount,
          finalPrice: computedFinalPrice,
        }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingData.ok) {
        setFormError(bookingData.error || "予約に失敗しました。すでに予約済みの時間です。");
        return false;
      }
      return true;
    } catch {
      setFormError("予約に失敗しました。サーバーエラー。");
      return false;
    }
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
    const kanaValue = (form.elements.namedItem("kana") as HTMLInputElement)?.value || "";
    Cookies.set("booking_name", nameValue, { expires: 7 });
    Cookies.set("booking_email", emailValue, { expires: 7 });
    Cookies.set("booking_date", selectedDate, { expires: 7 });
    Cookies.set("booking_time", selectedTime, { expires: 7 });

    // --- Fix: Ensure 24-hour time is always sent ---
    let time24 = selectedTime.split(' - ')[0];
    // Normalize to HH:mm (24-hour, zero-padded)
    if (/^\d{1}:/.test(time24)) {
      time24 = time24.padStart(5, '0');
    }

    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonType, participants, currency: "jpy", coupon: couponConfirmed ? coupon : undefined }),
      });
      const data = await res.json();
      if (data.free) {
        // Free booking, send email now
        const emailSent = await sendBookingEmail({
          name: nameValue,
          email: emailValue,
          kana: kanaValue,
          date: `${selectedDate}T${time24}:00`,
          duration: 60,
          details: `レッスン種別: ${lessonType}, 参加者数: ${participants}`
        });
        if (emailSent) setStep(3);
      } else if (data.clientSecret) {
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

  // After successful payment, send booking email and go to confirmation
  async function handlePaymentSuccess() {
    const nameValue = Cookies.get("booking_name") || "";
    const emailValue = Cookies.get("booking_email") || "";
    const kanaValue = (document.getElementsByName("kana")[0] as HTMLInputElement)?.value || "";
    const dateValue = Cookies.get("booking_date") || "";
    const timeValue = Cookies.get("booking_time") || "";
    const emailSent = await sendBookingEmail({
      name: nameValue,
      email: emailValue,
      kana: kanaValue,
      date: `${dateValue}T${timeValue.split(' - ')[0]}:00`,
      duration: 60,
      details: `レッスン種別: ${lessonType}, 参加者数: ${participants}`
    });
    if (emailSent) setStep(3);
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

  // Move this after all hooks
  if (isLoading) {
    return (
      <main className="flex flex-col flex-1 min-w-0 w-full min-h-[100vh] pt-20">
        <div className="text-2xl text-gray-400">ロード中...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 w-full">
      <section className="flex flex-col items-center justify-center w-full px-4">
        <div className="flex flex-col items-center justify-center max-w-2xl min-w-[340px] w-full order-2 md:order-none min-h-0">
          <span
            className="font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#3881ff] mb-3 text-center w-full">
            レッスンを予約
          </span>
          {/* Price display, always visible */}
          <div className="w-full flex flex-col items-center mb-3">
            <div className="text-lg font-bold text-gray-200 flex flex-row items-center gap-4">
              <span>合計金額(税込み): <span className="text-[#3881ff] text-2xl font-extrabold">{priceLoading ? "..." : finalPrice !== null ? (finalPrice === 0 ? "無料" : finalPrice.toLocaleString() + "円") : (getLessonPrice() === 0 ? "無料" : getLessonPrice().toLocaleString() + "円")}</span></span>
            </div>
            {priceError && <div className="text-red-400 text-sm font-bold">{priceError}</div>}
            <div className="text-sm text-gray-400 mt-2 sm:mt-0 flex flex-row items-center">(参加者数: {participants}名)</div>
          </div>
          <ProgressBar step={step} />
          {/* If lessonType is set from query, skip selection and go to step 1 form */}
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
            <form className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full border-2 border-[#3881ff] flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0" onSubmit={handleSubmit}>
              <input type="hidden" name="lessonType" value={lessonType} />
              {/* Name and Kana Name inputs: stacked on mobile, side by side on desktop */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="block text-gray-200 text-base font-bold text-left mb-2" htmlFor="name">お名前（漢字）</label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="例: 山田 太郎"
                    defaultValue={Cookies.get("booking_name") || ""}
                    className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-gray-200 text-base font-bold text-left mb-2" htmlFor="kana">お名前（カナ）</label>
                  <input
                    id="kana"
                    name="kana"
                    required
                    placeholder="例: ヤマダ タロウ"
                    className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                  />
                </div>
              </div>
              {/* Email input and participants selector side by side on desktop, stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <div className="flex-1">
                  <label htmlFor="email" className="block text-gray-200 text-base font-bold text-left mb-2">メールアドレス</label>
                  <input
                    id="email"
                    name="email"
                    required
                    type="email"
                    placeholder="例: your@email.com"
                    defaultValue={Cookies.get("booking_email") || ""}
                    className="p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff] w-full"
                  />
                </div>
                {/* Participants selector */}
                <div className="flex flex-col gap-1 min-w-[160px] sm:ml-2">
                  <label className="text-gray-200 text-base font-bold mb-2">参加者数</label>
                  <div className="flex flex-row items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-[#23232a] text-[#3881ff] font-bold text-base border border-[#3881ff] hover:bg-[#3881ff] hover:text-white transition-all"
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      aria-label="減らす"
                    >-</button>
                    <span className="text-lg font-bold text-gray-100 w-12 text-center">{participants}名</span>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-[#23232a] text-[#3881ff] font-bold text-base border border-[#3881ff] hover:bg-[#3881ff] hover:text-white transition-all"
                      onClick={() => {
                        if (participants < 5) {
                          setParticipants(participants + 1);
                        } else {
                          setShowParticipantWarning(true);
                        }
                      }}
                      aria-label="増やす"
                    >+</button>
                  </div>
                  {showParticipantWarning && (
                    <div className="text-yellow-400 text-sm font-bold mt-1">参加者は最大5名までです。</div>
                  )}
                  <input type="hidden" name="participants" value={participants} />
                </div>
              </div>
              {/* Date and Time side by side on desktop, stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-gray-200 font-bold mb-2">予約日</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    required
                    className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                    style={{ color: selectedDate && getTimesForDate(selectedDate).length === 0 ? '#888' : undefined }}
                  >
                    <option value="">-- 日を選んでください --</option>
                    {getAvailableDates().map((date) => {
                      const d = new Date(date);
                      const weekday = d.getDay();
                      const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
                      const fullyBooked = isDateFullyBooked(date);
                      return (
                        <option key={date} value={date} disabled={fullyBooked} className={fullyBooked ? 'bg-[#23232a] text-gray-400' : ''} style={fullyBooked ? { color: '#888', backgroundColor: '#23232a', fontStyle: 'italic' } : {}}>
                          {date}（{weekdayNames[weekday]}）{fullyBooked ? "（満席）" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-200 font-bold mb-2">予約時間</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                    disabled={!selectedDate}
                  >
                    <option value="">-- 時間を選んでください --</option>
                    {selectedDate && getTimesForDate(selectedDate).length === 0 && (
                      <option value="" disabled style={{ color: '#888' }}>この日は満席です</option>
                    )}
                    {getTimesForDate(selectedDate).map((slot) => (
                      <option key={slot.value} value={slot.value} disabled={slot.disabled} style={slot.disabled ? { color: '#888', fontStyle: 'italic' } : {}}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Coupon input with submit button */}
              <div className="flex flex-col gap-2">
                <label htmlFor="coupon" className="block text-gray-200 text-base font-bold text-left">クーポンコード (任意)</label>
                <div className="flex flex-row gap-2 items-center">
                  <input
                    id="coupon"
                    name="coupon"
                    type="text"
                    placeholder="クーポン"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                  />
                  <button
                    type="button"
                    className="px-4 py-3 min-w-35 rounded bg-[#3881ff] text-white font-bold text-sm border border-[#3881ff] hover:bg-[#3881ff] hover:text-white transition-all"
                    onClick={() => setCouponConfirmed(true)}
                    disabled={priceLoading || !coupon || couponConfirmed}
                  >
                    {couponConfirmed ? "適用済み" : "クーポンを適用"}
                  </button>
                </div>
              </div>
              {formError && <div className="text-red-400 font-bold">{formError}</div>}
              <button type="submit" className="px-8 py-3 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50" disabled={formLoading}>
                {formLoading
                  ? "ロード中..."
                  : finalPrice === 0
                  ? "予約確定"
                  : "支払いへ進む"}
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
                  onSuccess={handlePaymentSuccess}
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
