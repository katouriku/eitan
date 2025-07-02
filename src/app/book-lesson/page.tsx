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
        className="btn-success px-8 py-3"
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
  const [substep, setSubstep] = useState<1 | 2 | 3 | 4>(1); // 1: participants, 2: contact info, 3: date/time, 4: price/payment
  const [lessonType, setLessonType] = useState<"online" | "in-person" | "">("");
  const [participants, setParticipants] = useState(1);
  const [showParticipantWarning, setShowParticipantWarning] = useState(false);
  
  // Contact info
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
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
  }, [lessonType, participants, couponConfirmed, coupon]); // Added 'coupon' to dependencies

  // Reset coupon confirmation if coupon input changes
  useEffect(() => {
    setCouponConfirmed(false);
    setPriceError(null);
  }, [coupon]);

  const isLoading = !weeklyAvailability || weeklyAvailability.length === 0;

  // --- New: Fetch all booked slots for the next 30 days ---
  const [allBookedSlots, setAllBookedSlots] = useState<Record<string, string[]>>({}); // { 'YYYY-MM-DD': ['HH:mm', ...] }

  // Function to refresh booked slots after a successful booking
  const refreshBookedSlots = useCallback(async () => {
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
        // Parse the UTC date string directly without timezone conversion
        const dateStr = b.date.slice(0, 10); // Extract YYYY-MM-DD from "2025-07-03T14:00:00+00:00"
        const timeStr = b.date.slice(11, 16); // Extract HH:MM from "2025-07-03T14:00:00+00:00"
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(timeStr);
      }
    }
    setAllBookedSlots(grouped);
  }, []);

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
        setWeeklyAvailability(data.weeklyAvailability || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setWeeklyAvailability([]);
      }
    }
    fetchAvailability();
    // Also fetch booked slots on mount
    refreshBookedSlots();
  }, [refreshBookedSlots]);

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
      if (weeklyAvailability.some((a) => dayToIndex[a.day.toLowerCase()] === weekday)) {
        dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
      }
    }
    return dates;
  }

  // Helper: Check if a date is fully booked
  function isDateFullyBooked(date: string) {
    const d = new Date(date);
    const weekday = d.getDay();
    const avail = weeklyAvailability.find((a) => dayToIndex[a.day.toLowerCase()] === weekday);
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

  // For a selected date, get all 1-hour slots from available ranges
  function getTimesForDate(date: string) {
    if (!date) return [];
    const d = new Date(date);
    const weekday = d.getDay();
    const avail = weeklyAvailability.find((a) => {
      const idx = dayToIndex[a.day.toLowerCase()];
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

  // Helper function to format price display
  const formatPrice = (price: number) => {
    return price === 0 ? "無料" : price.toLocaleString() + "円"
  }

  const getDisplayPrice = () => {
    if (priceLoading) return "..."
    if (finalPrice !== null) return formatPrice(finalPrice)
    return formatPrice(getLessonPrice())
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
        if (emailSent) {
          await refreshBookedSlots(); // Refresh the UI
          setStep(3);
        }
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
    if (emailSent) {
      setStep(3);
      // Refresh booked slots to update UI
      await refreshBookedSlots();
    }
  }

  // Progress bar component
  function ProgressBar({ step, substep }: { step: 1 | 2 | 3, substep?: 1 | 2 | 3 | 4 }) {
    // Convert to unified 6-step system: 1=lesson type, 2=participants, 3=contact, 4=date/time, 5=payment, 6=confirmation
    let currentStep = 1;
    if (step === 1) {
      if (lessonType === "") currentStep = 1; // lesson type selection
      else currentStep = substep ? substep + 1 : 2; // substeps 1-4 become steps 2-5
    } else if (step === 2) {
      currentStep = 5; // payment
    } else if (step === 3) {
      currentStep = 6; // confirmation
    }

    const stepLabels = ["タイプ", "人数", "連絡先", "日時", "支払い", "完了"];
    
    // Handle clicking on completed steps
    const handleStepClick = (stepNum: number) => {
      if (stepNum >= currentStep) return; // Can't go to future steps
      
      if (stepNum === 1 && lessonType) {
        // Reset to lesson type selection
        setLessonType("");
        setSubstep(1);
      } else if (stepNum === 2 && lessonType) {
        setSubstep(1); // participants
      } else if (stepNum === 3 && lessonType) {
        setSubstep(2); // contact info
      } else if (stepNum === 4 && lessonType) {
        setSubstep(3); // date/time
      } else if (stepNum === 5 && lessonType) {
        setSubstep(4); // payment
      }
    };
    
    return (
      <div className="w-full max-w-4xl mx-auto mb-8 px-6 progress-container">
        <div className="relative">
          {/* Progress bar container */}
          <div className="relative progress-bar-height">
            {/* Background progress line */}
            <div 
              className="absolute bg-gray-700 rounded-full progress-bar-line"
              style={{ 
                top: '100%', 
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            />
            
            {/* Active progress line */}
            <div 
              className="absolute bg-gradient-to-r from-[#3881ff] to-[#5a9eff] rounded-full transition-all duration-500 ease-out progress-bar-active"
              style={{ 
                top: '100%',
                transform: 'translateY(-50%)',
                width: currentStep === 1 ? '0px' : `calc((100% - var(--progress-offset, 50px)) * ${(currentStep - 1) / 5})`,
                zIndex: 2
              }}
            />
          </div>
          
          {/* Step circles and labels combined */}
          <div className="flex items-start justify-between progress-bar-container progress-bar-margin">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(stepNum)}
                  disabled={stepNum >= currentStep}
                  className={`progress-step-circle w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-3 ${
                    stepNum <= currentStep ? 'active' : ''
                  }`}
                  style={{ zIndex: 10 }}
                >
                  {stepNum}
                </button>
                <span 
                  className={`progress-step-label text-sm transition-colors text-center font-medium ${
                    stepNum <= currentStep ? 'text-[#3881ff]' : 'text-gray-500'
                  }`}
                >
                  {stepLabels[stepNum - 1]}
                </span>
              </div>
            ))}
          </div>
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
            className="font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#3881ff] mb-4 text-center w-full">
            レッスンを予約
          </span>
          {/* Price display and participant count, side-by-side on desktop - only show after lesson type selected */}
          {lessonType && (
            <>
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mb-2">
                <div className="text-base sm:text-lg font-bold text-gray-200 flex flex-row items-center gap-2">
                  <span>合計金額(税込み): <span className="text-[#3881ff] text-xl sm:text-2xl font-extrabold">{getDisplayPrice()}</span></span>
                </div>
                <div className="text-xs sm:text-sm text-gray-400 flex flex-row items-center">
                  (参加者数: {participants}名)
                </div>
              </div>
              {priceError && (
                <div className="text-red-400 text-sm font-bold text-center mb-2">{priceError}</div>
              )}
            </>
          )}
          <ProgressBar step={step} substep={step === 1 ? substep : undefined} />
          {/* If lessonType is set from query, skip selection and go to step 1 form */}
          {step === 1 && lessonType === "" && (
            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto backdrop-blur-sm hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
              <h3 className="text-2xl text-white mb-8 text-center font-bold">レッスンの種類を選択してください</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  className="btn-lesson btn-lesson-online"
                  onClick={() => setLessonType("online")}
                >
                  <div className="btn-lesson-content">
                    <div className="btn-lesson-icon">💻</div>
                    <div className="btn-lesson-title">オンラインレッスン</div>
                    <div className="btn-lesson-subtitle">Zoom、Google Meetなど</div>
                  </div>
                </button>
                <button
                  className="btn-lesson btn-lesson-inperson"
                  onClick={() => setLessonType("in-person")}
                >
                  <div className="btn-lesson-content">
                    <div className="btn-lesson-icon">🏠</div>
                    <div className="btn-lesson-title">対面レッスン</div>
                    <div className="btn-lesson-subtitle">ご自宅またはカフェなど</div>
                  </div>
                </button>
              </div>
              <div className="text-sm text-gray-300 mt-6 text-center bg-gray-700/60 p-4 rounded-xl border border-gray-600">
                ※ 対面レッスンは美里町から30分以内の場所のみ対応しています。
              </div>
            </div>
          )}
          {step === 1 && lessonType !== "" && (
            <div className="space-y-6 max-w-lg mx-auto">
              {/* Stage 1: Participants */}
              {substep === 1 && (
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
                  <h3 className="text-xl text-white mb-6 text-center font-bold">参加者数を選択</h3>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-[#3881ff] font-bold text-xl border-2 border-[#3881ff] hover:from-[#3881ff] hover:to-[#5a9eff] hover:text-white hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      disabled={participants <= 1}
                    >-</button>
                    <div className="text-center w-20">
                      <div className="text-4xl font-bold text-white w-full">{participants}</div>
                      <div className="text-gray-400">名</div>
                    </div>
                    <button
                      type="button"
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-[#3881ff] font-bold text-xl border-2 border-[#3881ff] hover:from-[#3881ff] hover:to-[#5a9eff] hover:text-white hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                      onClick={() => {
                        if (participants < 5) {
                          setParticipants(participants + 1);
                        } else {
                          setShowParticipantWarning(true);
                        }
                      }}
                      disabled={participants >= 5}
                    >+</button>
                  </div>
                  {showParticipantWarning && (
                    <div className="text-yellow-400 text-sm text-center mt-4 bg-yellow-900/20 p-3 rounded-lg">
                      参加者は最大5名までです。
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubstep(2)}
                    className="btn-primary w-full mt-8"
                  >
                    次へ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonType("")}
                    className="btn-danger w-full mt-4"
                  >
                    レッスンタイプを変更
                  </button>
                </div>
              )}

              {/* Stage 2: Contact Info */}
              {substep === 2 && (
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
                  <h3 className="text-xl text-white mb-6 text-center font-bold">お客様情報</h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">お名前（漢字）</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="例: 山田 太郎"
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">お名前（カナ）</label>
                        <input
                          type="text"
                          value={customerKana}
                          onChange={(e) => setCustomerKana(e.target.value)}
                          placeholder="例: ヤマダ タロウ"
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">メールアドレス</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="例: your@email.com"
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff]"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setSubstep(1)}
                      className="btn-danger flex-1"
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubstep(3)}
                      disabled={!customerName || !customerKana || !customerEmail}
                      className="btn-primary flex-1"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 3: Date and Time */}
              {substep === 3 && (
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
                  <h3 className="text-xl text-white mb-6 text-center font-bold">日時を選択</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">予約日</label>
                      <select
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime("");
                        }}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff]"
                        required
                      >
                        <option value="">-- 日を選んでください --</option>
                        {getAvailableDates().map((date) => {
                          const d = new Date(date);
                          const weekday = d.getDay();
                          const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
                          const fullyBooked = isDateFullyBooked(date);
                          return (
                            <option key={date} value={date} disabled={fullyBooked}>
                              {date}（{weekdayNames[weekday]}）{fullyBooked ? "（満席）" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">予約時間</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff]"
                        disabled={!selectedDate}
                        required
                      >
                        <option value="">-- 時間を選んでください --</option>
                        {selectedDate && getTimesForDate(selectedDate).length === 0 && (
                          <option value="" disabled>この日は満席です</option>
                        )}
                        {getTimesForDate(selectedDate).map((slot) => (
                          <option key={slot.value} value={slot.value} disabled={slot.disabled}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setSubstep(2)}
                      className="btn-danger flex-1"
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubstep(4)}
                      disabled={!selectedDate || !selectedTime}
                      className="btn-primary flex-1"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 4: Price and Payment */}
              {substep === 4 && (
                <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
                  <input type="hidden" name="lessonType" value={lessonType} />
                  <input type="hidden" name="name" value={customerName} />
                  <input type="hidden" name="kana" value={customerKana} />
                  <input type="hidden" name="email" value={customerEmail} />
                  <input type="hidden" name="participants" value={participants} />
                  
                  <h3 className="text-xl text-white mb-8 text-center font-bold">料金確認・お支払い</h3>
                  
                  {/* Summary */}
                  <div className="bg-gray-800/50 p-4 rounded-lg mb-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">レッスン形式:</span>
                      <span className="text-white">{lessonType === 'online' ? 'オンライン' : '対面'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">参加者数:</span>
                      <span className="text-white">{participants}名</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">日時:</span>
                      <span className="text-white">{selectedDate} {selectedTime}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">クーポンコード（任意）</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          placeholder="クーポンコード"
                          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff]"
                        />
                        <button
                          type="button"
                          onClick={() => setCouponConfirmed(true)}
                          disabled={!coupon || couponConfirmed || priceLoading}
                          className="btn-success"
                        >
                          {couponConfirmed ? "適用済み" : "適用"}
                        </button>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-[#3881ff]">
                        合計: {getDisplayPrice()}
                      </div>
                      {priceError && <div className="text-red-400 text-sm mt-2">{priceError}</div>}
                    </div>
                  </div>

                  {formError && <div className="text-red-400 text-center mb-4">{formError}</div>}

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setSubstep(3)}
                      className="btn-danger flex-1"
                    >
                      戻る
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="btn-primary flex-1"
                    >
                      {formLoading ? "処理中..." : finalPrice === 0 ? "予約確定" : "支払いへ進む"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          {step === 2 && clientSecret && (
            <div
              className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl shadow-xl w-full flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] overflow-y-auto justify-center hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300"
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
            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl shadow-xl w-full flex flex-col items-center gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] justify-center hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
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
