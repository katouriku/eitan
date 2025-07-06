"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import Cookies from "js-cookie";
import "../globals.css";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { useQueryParam } from "./useQueryParam";
import Calendar from "../../components/Calendar";
import LoadingAnimation from "../../components/LoadingAnimation";
import { useTheme } from "../../contexts/ThemeContext";
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

function StripePaymentForm({ onSuccess, onError, onBack }: { clientSecret: string, onSuccess: () => void, onError: (msg: string) => void, onBack: () => void }) {
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
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
        }}
      />
      {error && <div className="text-red-400 font-bold mt-2">{error}</div>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-danger flex-1"
        >
          戻る
        </button>
        <button
          className="btn-success flex-1"
          type="submit"
          disabled={loading || !stripe || !elements}
        >
          {loading ? "処理中..." : "お支払いを確定する"}
        </button>
      </div>
    </form>
  );
}

export default function BookLessonPage() {
  const { resolvedTheme } = useTheme();
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
    // Start from 3 days in the future to match available dates
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 3);
    const start = formatDateString(startDate);
    
    // End 30 days from the start date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 29);
    const end = formatDateString(endDate);
    
    const res = await fetch(`/api/booking?start=${start}&end=${end}`);
    const data = await res.json();
    
    // Group by date
    const grouped: Record<string, string[]> = {};
    if (Array.isArray(data.bookings)) {
      for (const b of data.bookings) {
        // Convert UTC time to JST using proper timezone conversion
        const utcDate = new Date(b.date);
        
        // Get JST date and time
        const jstDateStr = utcDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
        const jstTimeStr = utcDate.toLocaleTimeString('en-GB', { 
          timeZone: 'Asia/Tokyo',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }); // HH:MM format
        
        console.log('Processing booking:', { 
          original: b.date, 
          utcDate: utcDate.toISOString(), 
          jstDateStr, 
          jstTimeStr 
        });
        
        if (!grouped[jstDateStr]) grouped[jstDateStr] = [];
        grouped[jstDateStr].push(jstTimeStr);
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

  // Try to load from cookies on mount and restore state
  useEffect(() => {
    const savedName = Cookies.get("booking_name") || "";
    const savedKana = Cookies.get("booking_kana") || "";
    const savedEmail = Cookies.get("booking_email") || "";
    const savedDate = Cookies.get("booking_date") || "";
    const savedTime = Cookies.get("booking_time") || "";
    const savedParticipants = Cookies.get("booking_participants");
    const savedLessonType = Cookies.get("booking_lessonType") as "online" | "in-person" | "";
    const savedClientSecret = Cookies.get("booking_clientSecret") || "";
    const savedStep = Cookies.get("booking_step");
    
    // Restore form data
    if (savedName) setCustomerName(savedName);
    if (savedKana) setCustomerKana(savedKana);
    if (savedEmail) setCustomerEmail(savedEmail);
    if (savedDate) setSelectedDate(savedDate);
    if (savedTime) setSelectedTime(savedTime);
    if (savedParticipants) setParticipants(parseInt(savedParticipants));
    if (savedLessonType) setLessonType(savedLessonType);
    
    // Restore payment session if exists
    if (savedClientSecret && savedStep === "2") {
      setClientSecret(savedClientSecret);
      setStep(2);
      return; // Skip normal progress restoration when in payment mode
    }
    
    // Restore progress - advance to appropriate substep if data exists
    if (savedLessonType && !lessonTypeParam) {
      if (savedName && savedKana && savedEmail && savedDate && savedTime) {
        setSubstep(4); // Go to payment step if all info is filled
      } else if (savedName && savedKana && savedEmail) {
        setSubstep(3); // Go to date/time step if contact info is filled
      } else if (savedParticipants) {
        setSubstep(2); // Go to contact step if participants is set
      } else {
        setSubstep(1); // Start with participants
      }
    }
  }, [lessonTypeParam]);

  // Save form data to cookies when it changes
  useEffect(() => {
    if (customerName) Cookies.set("booking_name", customerName, { expires: 30 });
  }, [customerName]);
  
  useEffect(() => {
    if (customerKana) Cookies.set("booking_kana", customerKana, { expires: 30 });
  }, [customerKana]);
  
  useEffect(() => {
    if (customerEmail) Cookies.set("booking_email", customerEmail, { expires: 30 });
  }, [customerEmail]);
  
  useEffect(() => {
    if (selectedDate) Cookies.set("booking_date", selectedDate, { expires: 30 });
  }, [selectedDate]);
  
  useEffect(() => {
    if (selectedTime) Cookies.set("booking_time", selectedTime, { expires: 30 });
  }, [selectedTime]);
  
  useEffect(() => {
    if (participants) Cookies.set("booking_participants", participants.toString(), { expires: 30 });
  }, [participants]);
  
  // Save client secret and step for payment session persistence
  useEffect(() => {
    if (clientSecret) {
      Cookies.set("booking_clientSecret", clientSecret, { expires: 1 }); // Short expiry for security
    }
  }, [clientSecret]);
  
  useEffect(() => {
    Cookies.set("booking_step", step.toString(), { expires: 1 });
  }, [step]);
  
  // Clear all booking cookies after booking confirmation
  useEffect(() => {
    if (step === 3) {
      Cookies.remove("booking_name");
      Cookies.remove("booking_kana");
      Cookies.remove("booking_email");
      Cookies.remove("booking_date");
      Cookies.remove("booking_time");
      Cookies.remove("booking_participants");
      Cookies.remove("booking_lessonType");
      Cookies.remove("booking_clientSecret");
      Cookies.remove("booking_step");
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

  // Helper function to format date safely without timezone issues
  function formatDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Generate available dates starting 3 days from now (30 days total)
  function getAvailableDates() {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 3; i < 33; i++) { // Start from day 3, go to day 32 (30 days total)
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = d.getDay();
      // Find if this weekday is available
      if (weeklyAvailability.some((a) => dayToIndex[a.day.toLowerCase()] === weekday)) {
        dates.push(formatDateString(d)); // Use timezone-safe formatting
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
    
    // Get form values
    const form = e.currentTarget as HTMLFormElement;
    const nameValue = (form.elements.namedItem("name") as HTMLInputElement)?.value || customerName;
    const emailValue = (form.elements.namedItem("email") as HTMLInputElement)?.value || customerEmail;
    const kanaValue = (form.elements.namedItem("kana") as HTMLInputElement)?.value || customerKana;

    // --- Fix: Ensure 24-hour time is always sent ---
    let time24 = selectedTime.split(' - ')[0];
    // Normalize to HH:mm (24-hour, zero-padded)
    if (/^\d{1}:/.test(time24)) {
      time24 = time24.padStart(5, '0');
    }
    
    // Create a proper date in Japan timezone (JST is UTC+9)
    const bookingDateTime = `${selectedDate}T${time24}:00+09:00`;

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
          date: bookingDateTime,
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
    const nameValue = customerName;
    const emailValue = customerEmail;
    const kanaValue = customerKana;
    const dateValue = selectedDate;
    const timeValue = selectedTime;
    
    // Create proper timezone-aware date
    let time24 = timeValue.split(' - ')[0];
    if (/^\d{1}:/.test(time24)) {
      time24 = time24.padStart(5, '0');
    }
    const bookingDateTime = `${dateValue}T${time24}:00+09:00`;
    
    const emailSent = await sendBookingEmail({
      name: nameValue,
      email: emailValue,
      kana: kanaValue,
      date: bookingDateTime,
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
      
      if (stepNum === 1) {
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
      <div className="w-full max-w-4xl mx-auto mb-4 px-6 progress-container">
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
    return <LoadingAnimation fullScreen={false} />;
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 w-full">
      <section className="flex flex-col items-center justify-center w-full px-4">
        <div className="flex flex-col items-center justify-center max-w-2xl min-w-[340px] w-full order-2 md:order-none min-h-0">
          <ProgressBar step={step} substep={step === 1 ? substep : undefined} />
          
          {/* Price display - always reserve space to prevent layout shifts */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 min-h-[2rem]">
            {lessonType && (
              <>
                <div className="text-base sm:text-lg font-bold text-[var(--muted-foreground)] flex flex-row items-center gap-2">
                  <span>合計金額(税込み): <span className="text-[#3881ff] text-xl sm:text-2xl font-extrabold">{getDisplayPrice()}</span></span>
                </div>
                <div className="text-xs sm:text-sm text-[var(--muted-foreground)] flex flex-row items-center">
                  (参加者数: {participants}名)
                </div>
              </>
            )}
          </div>
          {lessonType && priceError && (
            <div className="text-red-400 text-sm font-bold text-center mb-4">{priceError}</div>
          )}
          {/* If lessonType is set from query, skip selection and go to step 1 form */}
          {step === 1 && lessonType === "" && (
            <div className="bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto backdrop-blur-sm hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3881ff] to-[#5a9eff] rounded-full mb-6 shadow-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-3xl text-[var(--foreground)] font-bold mb-2">レッスンの種類を選択してください</h3>
                <div className="w-40 h-1 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  className="btn-lesson"
                  onClick={() => setLessonType("online")}
                >
                  <div className="btn-lesson-content">
                    <div className="btn-lesson-icon">💻</div>
                    <div className="btn-lesson-title">オンラインレッスン</div>
                    <div className="btn-lesson-subtitle">Discord, Zoomなど</div>
                    <div className="text-[var(--primary)] font-bold text-lg mt-2">2,500円〜</div>
                  </div>
                </button>
                <button
                  className="btn-lesson"
                  onClick={() => setLessonType("in-person")}
                >
                  <div className="btn-lesson-content">
                    <div className="btn-lesson-icon">🏠</div>
                    <div className="btn-lesson-title">対面レッスン</div>
                    <div className="btn-lesson-subtitle">ご自宅または交流センター</div>
                    <div className="text-[var(--primary)] font-bold text-lg mt-2">3,000円〜</div>
                  </div>
                </button>
              </div>
              <div className="text-sm text-[var(--muted-foreground)] mt-6 text-center bg-[var(--muted)]/60 p-4 rounded-xl border border-[var(--border)]">
                ※ 対面レッスンは美里町から30分以内の場所のみ対応しています。
              </div>
            </div>
          )}
          {step === 1 && lessonType !== "" && (
            <div className="space-y-6 w-full max-w-6xl mx-auto">
              {/* Stage 1: Participants */}
              {substep === 1 && (
                <div className="bg-[var(--card)]/50 border border-[var(--border)] p-6 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300 max-w-sm mx-auto">
                  <h3 className="text-2xl text-[var(--foreground)] text-center font-bold">参加者数を選択</h3>
                  <div className="flex items-center justify-center mt-8 gap-4">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-gradient-to-br from-[var(--muted)] to-[var(--secondary)] text-[#3881ff] font-bold text-lg border-2 border-[#3881ff] hover:from-[#3881ff] hover:to-[#5a9eff] hover:text-black hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center justify-center min-w-[40px]"
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      disabled={participants <= 1}
                    >-</button>
                    <div className="text-center px-4">
                      <div className="text-4xl font-bold text-[var(--foreground)]">{participants}</div>
                      <div className="text-[var(--muted-foreground)] text-sm">名</div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-gradient-to-br from-[var(--muted)] to-[var(--secondary)] text-[#3881ff] font-bold text-lg border-2 border-[#3881ff] hover:from-[#3881ff] hover:to-[#5a9eff] hover:text-black hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center justify-center min-w-[40px]"
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
                  <div className="flex gap-3 mt-8 justify-center">
                    <button
                      type="button"
                      onClick={() => setLessonType("")}
                      className="btn-danger w-24"
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubstep(2)}
                      className="btn-primary w-24"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Contact Info */}
              {substep === 2 && (
                <div className="bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300 max-w-2xl mx-auto">
                  <h3 className="text-2xl text-[var(--foreground)] text-center font-bold">お客様情報</h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 mt-10">
                      <div>
                        <label className="block text-[var(--foreground)] font-medium mb-2">お名前（漢字）</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="例: 山田 太郎"
                          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] min-w-0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--foreground)] font-medium mb-2">お名前（カナ）</label>
                        <input
                          type="text"
                          value={customerKana}
                          onChange={(e) => setCustomerKana(e.target.value)}
                          placeholder="例: ヤマダ タロウ"
                          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] min-w-0"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[var(--foreground)] font-medium mb-2">メールアドレス</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="例: your@email.com"
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        title="有効なメールアドレスを入力してください"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] min-w-0"
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
                <div className={`bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-700 ease-out ${
                  selectedDate ? 'max-w-none' : 'max-w-md mx-auto'
                }`}>
                  {/* Dynamic container that grows when date is selected */}
                  <div className={`flex flex-col lg:flex-row lg:gap-6 space-y-6 lg:space-y-0 w-full transition-all duration-700 ease-out ${
                    selectedDate ? 'lg:justify-start' : 'lg:justify-center'
                  }`}>
                    {/* Calendar Section */}
                    <div className="lg:w-80 lg:flex-shrink-0">
                      <Calendar
                        availableDates={getAvailableDates()}
                        selectedDate={selectedDate}
                        onDateSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime("");
                        }}
                        fullyBookedDates={getAvailableDates().filter(date => isDateFullyBooked(date))}
                      />
                      {/* Return button positioned below calendar on desktop only */}
                      <button
                        type="button"
                        onClick={() => setSubstep(2)}
                        className="btn-danger w-full mt-4 hidden lg:block"
                      >
                        戻る
                      </button>
                    </div>
                    
                    {/* Time Selection Section - Animates in when date selected */}
                    <div className={`lg:flex-1 lg:min-w-0 transition-all duration-700 ease-out ${
                      selectedDate 
                        ? 'opacity-100 lg:max-w-none lg:translate-x-0' 
                        : 'opacity-0 lg:max-w-0 lg:translate-x-4 lg:overflow-hidden'
                    }`}>
                      {selectedDate && (
                        <div className="animate-fadeIn">
                          {getTimesForDate(selectedDate).length > 0 ? (
                            <div 
                              className="grid gap-2 w-full"
                              style={{
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                maxHeight: '400px', // Match approximate calendar height
                                gridAutoFlow: 'column',
                                gridTemplateRows: 'repeat(8, minmax(45px, auto))'
                              }}
                            >
                              {getTimesForDate(selectedDate).map((slot) => (
                                <button
                                  key={slot.value}
                                  type="button"
                                  onClick={() => {
                                    if (!slot.disabled) {
                                      setSelectedTime(slot.value);
                                      // Auto-advance to next step when time is selected
                                      setTimeout(() => setSubstep(4), 300);
                                    }
                                  }}
                                  disabled={slot.disabled}
                                  className={`
                                    px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border-2 whitespace-nowrap h-[46px] relative shadow-lg
                                    ${slot.disabled
                                      ? 'bg-red-900/60 text-red-300 border-red-700/60 cursor-not-allowed opacity-80 line-through decoration-red-400 decoration-2'
                                      : selectedTime === slot.value
                                      ? 'bg-gradient-to-br from-[#3881ff] to-[#5a9eff] text-blue-500 border-[#3881ff] shadow-xl ring-2 ring-[#3881ff]/40 transform scale-105 z-10'
                                      : 'bg-gradient-to-br from-[var(--muted)] to-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] hover:from-[#3881ff] hover:to-[#5a9eff] hover:border-[#3881ff] hover:shadow-xl hover:transform hover:scale-105 hover:ring-2 hover:ring-[#3881ff]/30'
                                    }
                                  `}
                                >
                                  <div className="flex items-center justify-center">
                                    <span className="font-semibold text-sm leading-tight">
                                      {slot.disabled ? slot.label.replace('（予約済み）', '') : slot.label}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-[var(--muted-foreground)] bg-[var(--muted)]/50 rounded-lg border border-[var(--border)] animate-fadeIn">
                              <div className="text-lg font-medium">この日は満席です</div>
                              <div className="text-sm mt-1">他の日を選択してください</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Return button for mobile - appears below timeslots */}
                  <div className="mt-10 lg:hidden flex justify-center">
                    <button
                      type="button"
                      onClick={() => setSubstep(2)}
                      className="btn-danger w-full px-8 py-2"
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 4: Price and Payment */}
              {substep === 4 && (
                <form onSubmit={handleSubmit} className="bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-xl shadow-xl hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300 max-w-lg mx-auto">
                  <input type="hidden" name="lessonType" value={lessonType} />
                  <input type="hidden" name="name" value={customerName} />
                  <input type="hidden" name="kana" value={customerKana} />
                  <input type="hidden" name="email" value={customerEmail} />
                  <input type="hidden" name="participants" value={participants} />
                  
                  <h3 className="text-xl text-[var(--foreground)] text-center font-bold">料金確認・お支払い</h3>
                  
                  {/* Summary */}
                  <div className="bg-[var(--muted)]/50 p-3 mt-3 rounded-lg mb-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">レッスン形式:</span>
                      <span className="text-[var(--foreground)]">{lessonType === 'online' ? 'オンライン' : '対面'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">参加者数:</span>
                      <span className="text-[var(--foreground)]">{participants}名</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">日時:</span>
                      <span className="text-[var(--foreground)]">{selectedDate} {selectedTime}</span>
                    </div>
                  </div>

                  <div className="space-y-0">
                    <div>
                      <label className="block text-[var(--foreground)] font-medium mb-2 text-sm">クーポンコード（任意）</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          placeholder="クーポンコード"
                          className="flex-1 px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setCouponConfirmed(true)}
                          disabled={!coupon || couponConfirmed || priceLoading}
                          className="btn-success px-4 py-2 text-sm"
                        >
                          {couponConfirmed ? "適用済み" : "適用"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {formError && <div className="text-red-400 text-center mb-3 text-sm">{formError}</div>}

                  <div className="flex gap-3 mt-6">
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
                      {formLoading ? "処理中..." : finalPrice === 0 ? "予約確定" : "支払い"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          {step === 2 && clientSecret && (
            <div
              className="bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-2xl shadow-xl w-full flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] overflow-y-auto justify-center hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300"
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
                    theme: resolvedTheme === 'dark' ? 'night' : 'stripe',
                    variables: {
                      colorPrimary: '#3881ff',
                      colorBackground: resolvedTheme === 'dark' ? '#18181b' : '#ffffff',
                      colorText: resolvedTheme === 'dark' ? '#ffffff' : '#1f2937',
                      colorDanger: '#dc2626',
                      borderRadius: '12px',
                      spacingUnit: '4px',
                      fontFamily: 'system-ui, sans-serif',
                    },
                    rules: {
                      '.Tab': {
                        display: 'block !important',
                        visibility: 'visible !important',
                      },
                      '.TabContainer': {
                        display: 'flex !important',
                        visibility: 'visible !important',
                      },
                      '.PaymentMethodSelector': {
                        display: 'block !important',
                        visibility: 'visible !important',
                      }
                    }
                  },
                }}
              >
                <StripePaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={msg => setFormError(msg)}
                  onBack={() => setStep(1)}
                />
              </Elements>
            </div>
          )}
          {step === 3 && (
            <div className="bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-2xl shadow-xl w-full flex flex-col items-center gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] justify-center hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
              <svg className="w-16 h-16 text-green-400 mb-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-green-400 font-bold text-2xl mb-2">予約完了!</div>
              <div className="text-[var(--muted-foreground)] text-center">
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
