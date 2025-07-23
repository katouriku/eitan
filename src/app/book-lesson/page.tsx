"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { addStudentToSupabase } from "./supabaseStudent";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import "../globals.css";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { useQueryParam } from "./useQueryParam";
import Calendar from "../../components/Calendar";
import LoadingAnimation from "../../components/LoadingAnimation";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
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
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Left Column - Security Info (Desktop) */}
      <div className="lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
        {/* Security Notice */}
        <div className="bg-blue-50 light:bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-blue-900 dark:text-blue-200 text-lg mb-2">安全な決済</div>
              <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                お客様の個人情報やカード情報は、業界標準のSSL暗号化により完全に保護されています。
              </div>
            </div>
          </div>
          
          {/* Security features list */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">256ビット暗号化</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">PCI DSS準拠</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">Stripe社提供</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Payment Form */}
      <div className="flex-1 order-1 lg:order-2">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3881ff] to-[#5a9eff] rounded-full mb-4 shadow-md">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-2xl text-[var(--foreground)] font-bold mb-2">お支払い情報</h3>
          <p className="text-[var(--muted-foreground)]">
            安全な決済システムでお支払いを完了してください
          </p>
        </div>

        <form id="stripe-payment-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Element Container */}
          <div className="bg-[var(--muted)]/20 p-6 rounded-xl border border-[var(--border)]">
            <PaymentElement
              options={{
                layout: {
                  type: "tabs",
                  defaultCollapsed: false,
                },
                fields: {
                  billingDetails: {
                    name: "auto",
                    email: "auto",
                    phone: "auto",
                    address: {
                      country: "auto",
                      line1: "auto",
                      line2: "auto",
                      city: "auto",
                      state: "auto",
                      postalCode: "auto"
                    }
                  }
                }
              }}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-800 dark:text-red-200 mb-1">お支払いエラー</div>
                  <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            戻る
          </button>
          <button
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            type="submit"
            disabled={loading || !stripe || !elements}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                処理中...
              </div>
            ) : (
              "お支払いを確定する"
            )}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

export default function BookLessonPage() {
  const { resolvedTheme } = useTheme();
  const { user, signIn } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStepState] = useState<1 | 2 | 3>(1);
  const [substep, setSubstep] = useState<1 | 2 | 3 | 4>(1); // 1: basic info, 2: student info, 3: date/time, 4: price/payment
  const [lessonType, setLessonType] = useState<"online" | "in-person" | "">("");
  const [participants, setParticipants] = useState(1);
  const [showParticipantWarning, setShowParticipantWarning] = useState(false);
  
  // Contact info
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  // Student info
  const [isStudentBooker, setIsStudentBooker] = useState(true); // Default to booker is student
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentEnglishLevel, setStudentEnglishLevel] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  
  const paymentFormRef = useRef<HTMLDivElement>(null);
  const lessonTypeParam = useQueryParam("lessonType");

  // Coupon state
  const [coupon, setCoupon] = useState("");
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [couponConfirmed, setCouponConfirmed] = useState(false);
  const [isFreeTrialActive, setIsFreeTrialActive] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  
  // Saved payment methods for returning customers
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<Array<{
    id: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  }>>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  // Enable free trial UI for first-time users via query param (only if not signed in) or for signed-in users with no bookings
  useEffect(() => {
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    const freeLessonParam = url?.searchParams.get('freelesson');
    if (!user?.email && freeLessonParam === '1') {
      // Unsigned-in user with ?freelesson=1
      setCoupon('freelesson');
      setCouponConfirmed(true);
      setIsFreeTrialActive(true);
      return;
    }
    // For signed-in users, check for existing bookings
    const checkExistingBookings = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch(`/api/booking?customer_email=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        if (response.ok && data.bookings && data.bookings.length > 0) {
          // User has existing bookings - no free trial
          setIsFreeTrialActive(false);
        } else {
          setCoupon('freelesson');
          setCouponConfirmed(true);
          setIsFreeTrialActive(true);
        }
      } catch (error) {
        console.error('Error checking existing bookings:', error);
      }
    };
    if (user?.email) {
      checkExistingBookings();
    }
  }, [user?.email]);

  // Load saved payment methods for authenticated users
  useEffect(() => {
    const loadSavedPaymentMethods = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/payment-methods?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok && data.paymentMethods) {
          setSavedPaymentMethods(data.paymentMethods);
        }
      } catch (error) {
        console.error('Error loading saved payment methods:', error);
      }
    };

    loadSavedPaymentMethods();
  }, [user?.id]);

  // Auto-update price when free trial is activated or lesson details change
  useEffect(() => {
    if (isFreeTrialActive && lessonType && participants) {
      updatePrice(lessonType, participants, "freelesson");
    }
  }, [isFreeTrialActive, lessonType, participants]);

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

  // Auto-load user info when user is authenticated
  useEffect(() => {
    if (user?.email) {
      setCustomerEmail(user.email);
      setCustomerName(user.user_metadata?.full_name || '');
      setCustomerKana(user.user_metadata?.full_name_kana || '');
    }
  }, [user]);

  // Auto-progress if user data exists and lessonType is set (for URL params or other cases)
  useEffect(() => {
    if (user && lessonType && lessonTypeParam) {
      // Only auto-progress when lesson type is set via URL parameter
      if (customerName && customerEmail && substep === 1) {
        setSubstep(2);
      }
    }
  }, [user, lessonType, customerName, customerEmail, lessonTypeParam, substep]);

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

  // Render progress bar in fixed container using portal
  const [progressBarContainer, setProgressBarContainer] = useState<HTMLElement | null>(null);
  const [sidebarContainer, setSidebarContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    const container = document.getElementById('progress-bar-container');
    setProgressBarContainer(container);
    
    const sidebar = document.getElementById('booking-sidebar-container');
    setSidebarContainer(sidebar);
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
          paymentMethod: computedFinalPrice === 0 ? 'free' : paymentMethod,
          // Student information
          isStudentBooker,
          studentName: isStudentBooker ? name : studentName,
          studentAge,
          studentGrade,
          studentEnglishLevel,
          studentNotes,
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
      // If cash payment is selected, skip Stripe and go directly to booking
      if (paymentMethod === "cash" && finalPrice !== 0) {
        const emailSent = await sendBookingEmail({
          name: nameValue,
          email: emailValue,
          kana: kanaValue,
          date: bookingDateTime,
          duration: 60,
          details: `レッスン種別: ${lessonType}, 参加者数: ${participants}, 支払い方法: 現金 (レッスン前)`
        });
        if (emailSent) {
          await refreshBookedSlots(); // Refresh the UI
          setStep(3);
        }
        return;
      }

      // If booking is free, skip payment step entirely
      if (finalPrice === 0 || (isFreeTrialActive && couponConfirmed)) {
        const emailSent = await sendBookingEmail({
          name: nameValue,
          email: emailValue,
          kana: kanaValue,
          date: bookingDateTime,
          duration: 60,
          details: `レッスン種別: ${lessonType}, 参加者数: ${participants}${isFreeTrialActive ? ' (無料体験)' : ''}`
        });
        if (emailSent) {
          await refreshBookedSlots(); // Refresh the UI
          setStep(3);
        }
        return;
      }

      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lessonType, 
          participants, 
          currency: "jpy", 
          coupon: couponConfirmed ? coupon : undefined,
          userId: user?.id,
          paymentMethodId: selectedPaymentMethodId,
        }),
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
    // For authenticated users: 1=lesson type, 2=date/time, 3=payment, 4=confirmation
    // For non-authenticated users: 1=lesson type, 2=info, 3=date/time, 4=payment, 5=confirmation
    let currentStep = 1;
    const isAuthenticated = !!user;
    
    if (step === 1) {
      if (lessonType === "") {
        currentStep = 1; // lesson type selection
      } else if (isAuthenticated) {
        // Authenticated users skip info step
        if (substep === 2) currentStep = 2; // date/time
        else if (substep === 3) currentStep = 3; // payment
      } else {
        // Non-authenticated users have info step
        if (substep === 1) currentStep = 2; // info
        else if (substep === 2) currentStep = 3; // date/time
        else if (substep === 3) currentStep = 4; // payment
      }
    } else if (step === 2) {
      currentStep = isAuthenticated ? 3 : 4; // payment (Stripe)
    } else if (step === 3) {
      currentStep = isAuthenticated ? 4 : 5; // confirmation
    }

    const stepLabels = isAuthenticated 
      ? ["タイプ", "日時", "支払い", "完了"]
      : ["タイプ", "情報", "日時", "支払い", "完了"];
    const totalSteps = isAuthenticated ? 4 : 5;
    
    // Handle clicking on completed steps
    const handleStepClick = (stepNum: number) => {
      if (stepNum >= currentStep) return; // Can't go to future steps
      
      if (stepNum === 1) {
        // Reset to lesson type selection
        setLessonType("");
        setSubstep(1);
      } else if (isAuthenticated) {
        // Authenticated user flow
        if (stepNum === 2 && lessonType) setSubstep(2); // date/time
        else if (stepNum === 3 && lessonType) setSubstep(3); // payment
      } else {
        // Non-authenticated user flow  
        if (stepNum === 2 && lessonType) setSubstep(1); // info
        else if (stepNum === 3 && lessonType) setSubstep(2); // date/time
        else if (stepNum === 4 && lessonType) setSubstep(3); // payment
      }
    };
    
    return (
      <div className="w-full max-w-4xl mx-auto mb-2 px-6 progress-container">
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
                width: currentStep === 1 ? '0px' : `calc((100% - var(--progress-offset, 50px)) * ${(currentStep - 1) / (totalSteps - 1)})`,
                zIndex: 2
              }}
            />
          </div>
          
          {/* Step circles and labels combined */}
          <div className="flex items-start justify-between progress-bar-container progress-bar-margin">
            {Array.from({length: totalSteps}, (_, i) => i + 1).map((stepNum) => (
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

  // Sidebar component - Always visible with placeholders
  function BookingSidebar() {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 text-center">予約詳細</h3>
        {/* Price display */}
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-[var(--muted-foreground)] mb-1">合計金額(税込み)</div>
            <div className="text-2xl font-bold text-[#3881ff]">
              {lessonType ? (
                isFreeTrialActive ? (
                  <span className="flex flex-col items-center">
                    <span className="line-through text-[var(--muted-foreground)] text-base mb-1">{getLessonPrice().toLocaleString()}円</span>
                    <span className="text-green-500 text-2xl font-bold">無料</span>
                  </span>
                ) : (
                  getDisplayPrice()
                )
              ) : "－"}
            </div>
          </div>
          {/* Participant count */}
          <div className="flex justify-between items-center py-2 border-t border-[var(--border)]/30">
            <span className="text-[var(--muted-foreground)] font-medium">参加者数</span>
            <span className="text-[var(--foreground)] font-semibold">
              {lessonType ? `${participants}名` : "－"}
            </span>
          </div>
          {/* Lesson type */}
          <div className="flex justify-between items-center py-2 border-t border-[var(--border)]/30">
            <span className="text-[var(--muted-foreground)] font-medium">レッスン形式</span>
            <span className="text-[var(--foreground)] font-semibold">
              {lessonType === 'online' ? 'オンライン' : lessonType === 'in-person' ? '対面' : '－'}
            </span>
          </div>
          {/* Date */}
          <div className="flex justify-between items-center py-2 border-t border-[var(--border)]/30">
            <span className="text-[var(--muted-foreground)] font-medium">予約日</span>
            <span className="text-[var(--foreground)] font-semibold">
              {selectedDate || "－"}
            </span>
          </div>
          {/* Time */}
          <div className="flex justify-between items-center py-2 border-t border-[var(--border)]/30">
            <span className="text-[var(--muted-foreground)] font-medium">予約時間</span>
            <span className="text-[var(--foreground)] font-semibold">
              {selectedTime || "－"}
            </span>
          </div>
        </div>
        {/* Error display */}
        {priceError && lessonType && (
          <div className="text-red-400 text-sm font-bold text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            {priceError}
          </div>
        )}
      </div>
    );
  }

  // Move this after all hooks
  if (isLoading) {
    return <LoadingAnimation fullScreen={true} />;
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 w-full">
      {/* Render progress bar in fixed container using portal */}
      {progressBarContainer && createPortal(
        <ProgressBar step={step} substep={step === 1 ? substep : undefined} />,
        progressBarContainer
      )}
      
      {/* Always render sidebar in fixed container using portal - desktop only, hidden during payment */}
      {sidebarContainer && !(step === 1 && substep === 3) && createPortal(
        <BookingSidebar />,
        sidebarContainer
      )}
      
      <section className="flex flex-col items-center justify-center w-full px-4">
        <div className="flex flex-col items-center justify-center max-w-4xl min-w-[340px] w-full">
          {/* If lessonType is set from query, skip selection and go to step 1 form */}
          {step === 1 && lessonType === "" && (
            <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl shadow-lg w-full max-w-2xl mx-auto hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3881ff] to-[#5a9eff] rounded-full mb-6 shadow-md">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-3xl text-[var(--foreground)] font-bold mb-3">レッスンの種類を選択してください</h3>
                <div className="w-32 h-1 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  className="group relative p-6 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] hover:border-[#3881ff] hover:bg-[var(--muted)]/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  onClick={() => {
                    setLessonType("online");
                    // For authenticated users with complete info, skip directly to date/time selection
                    if (user && customerName && customerEmail) {
                      setSubstep(2);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform duration-300">
                      💻
                    </div>
                    <div className="text-xl font-bold text-[var(--foreground)] mb-2">オンラインレッスン</div>
                    <div className="text-sm text-[var(--muted-foreground)] mb-4">Discordで</div>
                    <div className="text-[#3881ff] font-bold text-lg">
                      {isFreeTrialActive ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="line-through text-[var(--muted-foreground)]">2,500円〜</span>
                          <span className="text-green-500">無料</span>
                        </div>
                      ) : (
                        "2,500円〜"
                      )}
                    </div>
                  </div>
                </button>
                <button
                  className="group relative p-6 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] hover:border-[#3881ff] hover:bg-[var(--muted)]/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  onClick={() => {
                    setLessonType("in-person");
                    // For authenticated users with complete info, skip directly to date/time selection
                    if (user && customerName && customerEmail) {
                      setSubstep(2);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform duration-300">
                      🏠
                    </div>
                    <div className="text-xl font-bold text-[var(--foreground)] mb-2">対面レッスン</div>
                    <div className="text-sm text-[var(--muted-foreground)] mb-4">ご自宅または交流センター</div>
                    <div className="text-[#3881ff] font-bold text-lg">
                      {isFreeTrialActive ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="line-through text-[var(--muted-foreground)]">3,000円〜</span>
                          <span className="text-green-500">無料</span>
                        </div>
                      ) : (
                        "3,000円〜"
                      )}
                    </div>
                  </div>
                </button>
              </div>
              <div className="text-sm text-[var(--muted-foreground)] mt-4 text-center bg-[var(--muted)]/30 p-4 rounded-xl border border-[var(--border)]">
                ※ 対面レッスンは美里町から30分以内の場所のみ対応しています。
              </div>
            </div>
          )}
          {step === 1 && lessonType !== "" && (
            <div className="space-y-6 w-full max-w-6xl mx-auto">
              {/* Stage 1: Account Setup (if not authenticated) or Participants Selection */}
              {substep === 1 && !user && (
                <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-xl shadow-lg max-w-3xl mx-auto hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3881ff] to-[#5a9eff] rounded-full mb-4 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl text-[var(--foreground)] font-bold mb-2">基本情報の入力</h4>
                    <p className="text-[var(--muted-foreground)]">
                      アカウント作成に必要な基本情報を入力してください
                    </p>
                  </div>

                  {/* Account Creation Form */}
                  <div className="space-y-6">
                    {/* Participants Section */}
                    <div>
                      <h5 className="text-lg text-[var(--foreground)] font-semibold text-center mb-4">参加者数を選択</h5>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          className="w-12 h-12 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[#3881ff] font-bold text-xl border-2 border-[var(--border)] hover:border-[#3881ff] transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center justify-center"
                          onClick={() => setParticipants(Math.max(1, participants - 1))}
                          disabled={participants <= 1}
                        >-</button>
                        <div className="text-center px-6">
                          <div className="text-3xl font-bold text-[var(--foreground)]">{participants}</div>
                          <div className="text-[var(--muted-foreground)] text-sm">名</div>
                        </div>
                        <button
                          type="button"
                          className="w-12 h-12 rounded-xl bg-[var(--muted)] hover:bg-[#3881ff] text-[#3881ff] hover:text-white font-bold text-xl border-2 border-[var(--border)] hover:border-[#3881ff] transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center justify-center"
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
                        <div className="text-amber-600 dark:text-amber-400 text-sm text-center mt-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          参加者は最大5名までです。
                        </div>
                      )}
                    </div>

                    {/* Account Information */}
                    <div>
                      <h5 className="text-lg text-[var(--foreground)] font-semibold mb-4">アカウント情報</h5>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[var(--foreground)] font-medium mb-2">お名前（漢字） <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="例: 山田 太郎"
                            className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
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
                            className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-[var(--foreground)] font-medium mb-2">メールアドレス <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="例: name@gmail.com"
                          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                          required
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-[var(--foreground)] font-medium mb-2">パスワード <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="6文字以上"
                          minLength={6}
                          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    {/* Student Info Section */}
                    <div>
                      <h5 className="text-lg text-[var(--foreground)] font-semibold mb-4">生徒情報</h5>
                      
                      {/* Student is booker toggle */}
                      <div className="mb-6">
                        <div className="flex items-center justify-center gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isStudentBooker}
                              onChange={(e) => {
                                setIsStudentBooker(e.target.checked);
                                if (e.target.checked) {
                                  setStudentName(customerName);
                                  setStudentAge("");
                                  setStudentGrade("");
                                  setStudentEnglishLevel("");
                                  setStudentNotes("");
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isStudentBooker ? 'bg-[#3881ff]' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isStudentBooker ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                            <span className="ml-3 text-[var(--foreground)] font-medium">予約者本人がレッスンを受ける</span>
                          </label>
                        </div>
                      </div>

                      {!isStudentBooker && (
                        <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[var(--foreground)] font-medium mb-2">生徒のお名前</label>
                              <input
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="例: 山田 花子"
                                className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                                required={!isStudentBooker}
                              />
                            </div>
                            <div>
                              <label className="block text-[var(--foreground)] font-medium mb-2">年齢</label>
                              <input
                                type="number"
                                min="1"
                                max="18"
                                value={studentAge}
                                onChange={(e) => setStudentAge(e.target.value)}
                                placeholder="例: 12"
                                className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                              />
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[var(--foreground)] font-medium mb-2">学年</label>
                              <select
                                value={studentGrade}
                                onChange={(e) => setStudentGrade(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                              >
                                <option value="">選択してください</option>
                                <option value="未就学児">未就学児</option>
                                <option value="小学1年">小学1年</option>
                                <option value="小学2年">小学2年</option>
                                <option value="小学3年">小学3年</option>
                                <option value="小学4年">小学4年</option>
                                <option value="小学5年">小学5年</option>
                                <option value="小学6年">小学6年</option>
                                <option value="中学1年">中学1年</option>
                                <option value="中学2年">中学2年</option>
                                <option value="中学3年">中学3年</option>
                                <option value="高校1年">高校1年</option>
                                <option value="高校2年">高校2年</option>
                                <option value="高校3年">高校3年</option>
                                <option value="その他">その他</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[var(--foreground)] font-medium mb-2">英語レベル</label>
                              <select
                                value={studentEnglishLevel}
                                onChange={(e) => setStudentEnglishLevel(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                              >
                                <option value="">選択してください</option>
                                <option value="初心者">初心者</option>
                                <option value="初級">初級</option>
                                <option value="中級">中級</option>
                                <option value="上級">上級</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[var(--foreground)] font-medium mb-2">備考・特記事項</label>
                            <textarea
                              value={studentNotes}
                              onChange={(e) => setStudentNotes(e.target.value)}
                              placeholder="例: 好きなもの、苦手なもの、アレルギー、特別な配慮が必要なことなど"
                              rows={3}
                              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setLessonType("")}
                      className="flex-1 px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        // Validate required fields
                        if (!customerName || !customerEmail || !password || (!isStudentBooker && !studentName)) {
                          setFormError("必須項目を入力してください。");
                          return;
                        }

                        setFormLoading(true);
                        setFormError(null);
                        try {
                          // Use the admin signup API route for auto-confirmation
                          const signupResponse = await fetch('/api/auth/signup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: customerEmail,
                              password: password,
                              full_name: customerName,
                              full_name_kana: customerKana,
                              autoConfirm: true
                            })
                          });
                          const signupResult = await signupResponse.json();
                          console.log('Signup result:', signupResult);
                          const userId = signupResult.user?.id || signupResult.user?.user?.id;
                          if ((!userId) && signupResult.error) {
                            setFormError(`アカウント作成に失敗しました: ${signupResult.error}`);
                            setFormLoading(false);
                            return;
                          }
                          if (!userId) {
                            setFormError('ユーザーIDの取得に失敗しました。');
                            setFormLoading(false);
                            return;
                          }
                          // Now sign in the user
                          const { error: signInError } = await signIn(customerEmail, password);
                          if (signInError) {
                            setFormError('アカウントは作成されましたが、ログインに失敗しました。手動でログインしてください。');
                            setFormLoading(false);
                            return;
                          }
                          // Wait for session to be established (optional: add a small delay or check user context)
                          try {
                            await addStudentToSupabase({
                              userId,
                              name: isStudentBooker ? customerName : studentName,
                              age: isStudentBooker ? studentAge : studentAge,
                              grade_level: isStudentBooker ? studentGrade : studentGrade,
                              english_ability: isStudentBooker ? studentEnglishLevel : studentEnglishLevel,
                              notes: isStudentBooker ? studentNotes : studentNotes
                            });
                          } catch (err) {
                            console.error('Student insert error:', err);
                            setFormError('生徒情報の保存に失敗しました。');
                            setFormLoading(false);
                            return;
                          }
                          setSubstep(2);
                        } catch (error) {
                          console.error('Account creation error:', error);
                          setFormError('アカウント作成中にエラーが発生しました。');
                        }
                        setFormLoading(false);
                      }}
                      disabled={!customerName || !customerEmail || !password || (!isStudentBooker && !studentName) || formLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      {formLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          アカウント作成中...
                        </div>
                      ) : (
                        '次へ'
                      )}
                    </button>
                  </div>
                  
                  {formError && (
                    <div className="mt-4 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                      {formError}
                    </div>
                  )}
                </div>
              )}
              
              {substep === 1 && user && (
                <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-xl shadow-lg max-w-3xl mx-auto hover:shadow-xl transition-all duration-300">
                  
                  {/* Participants Section */}
                  <div className="mb-8">
                    <h4 className="text-lg text-[var(--foreground)] font-semibold text-center">参加者数を選択</h4>
                    <div className="flex items-center justify-center mt-4 gap-4">
                      <button
                        type="button"
                        className="w-12 h-12 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[#3881ff] font-bold text-xl border-2 border-[var(--border)] hover:border-[#3881ff] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-sm hover:shadow-md flex items-center justify-center"
                        onClick={() => setParticipants(Math.max(1, participants - 1))}
                        disabled={participants <= 1}
                      >-</button>
                      <div className="text-center px-6">
                        <div className="text-3xl font-bold text-[var(--foreground)]">{participants}</div>
                        <div className="text-[var(--muted-foreground)] text-sm">名</div>
                      </div>
                      <button
                        type="button"
                        className="w-12 h-12 rounded-xl bg-[var(--muted)] hover:bg-[#3881ff] text-[#3881ff] hover:text-white font-bold text-xl border-2 border-[var(--border)] hover:border-[#3881ff] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-sm hover:shadow-md flex items-center justify-center"
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
                      <div className="text-amber-600 dark:text-amber-400 text-sm text-center mt-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        参加者は最大5名までです。
                      </div>
                    )}
                  </div>

                  {/* Contact Info Section */}
                  <div className="mb-8">
                    <h4 className="text-lg text-[var(--foreground)] font-semibold text-center mb-4">お客様情報</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[var(--foreground)] font-medium mb-2">お名前（漢字）</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="例: 山田 太郎"
                          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
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
                          className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-[var(--foreground)] font-medium mb-2">メールアドレス</label>
                      <div className="w-full px-4 py-3 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed">
                        {user?.email}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        ログインアカウントのメールアドレスが使用されます
                      </p>
                    </div>
                  </div>

                  {/* Student Info Section */}
                  <div className="mb-8">
                    <h4 className="text-lg text-[var(--foreground)] font-semibold text-center mb-4">生徒情報</h4>
                    
                    {/* Student is booker toggle */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isStudentBooker}
                            onChange={(e) => {
                              setIsStudentBooker(e.target.checked);
                              if (e.target.checked) {
                                setStudentName(customerName);
                                setStudentAge("");
                                setStudentGrade("");
                                setStudentEnglishLevel("");
                                setStudentNotes("");
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isStudentBooker ? 'bg-[#3881ff]' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isStudentBooker ? 'translate-x-6' : 'translate-x-1'}`} />
                          </div>
                          <span className="ml-3 text-[var(--foreground)] font-medium">予約者本人がレッスンを受ける</span>
                        </label>
                      </div>
                    </div>

                    {!isStudentBooker && (
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[var(--foreground)] font-medium mb-2">生徒のお名前</label>
                            <input
                              type="text"
                              value={studentName}
                              onChange={(e) => setStudentName(e.target.value)}
                              placeholder="例: 山田 花子"
                              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                              required={!isStudentBooker}
                            />
                          </div>
                          <div>
                            <label className="block text-[var(--foreground)] font-medium mb-2">年齢</label>
                            <input
                              type="number"
                              min="1"
                              max="18"
                              value={studentAge}
                              onChange={(e) => setStudentAge(e.target.value)}
                              placeholder="例: 12"
                              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[var(--foreground)] font-medium mb-2">学年</label>
                            <select
                              value={studentGrade}
                              onChange={(e) => setStudentGrade(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                            >
                              <option value="">選択してください</option>
                              <option value="未就学児">未就学児</option>
                              <option value="小学1年">小学1年</option>
                              <option value="小学2年">小学2年</option>
                              <option value="小学3年">小学3年</option>
                              <option value="小学4年">小学4年</option>
                              <option value="小学5年">小学5年</option>
                              <option value="小学6年">小学6年</option>
                              <option value="中学1年">中学1年</option>
                              <option value="中学2年">中学2年</option>
                              <option value="中学3年">中学3年</option>
                              <option value="高校1年">高校1年</option>
                              <option value="高校2年">高校2年</option>
                              <option value="高校3年">高校3年</option>
                              <option value="その他">その他</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[var(--foreground)] font-medium mb-2">英語レベル</label>
                            <select
                              value={studentEnglishLevel}
                              onChange={(e) => setStudentEnglishLevel(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                            >
                              <option value="">選択してください</option>
                              <option value="初心者">初心者</option>
                              <option value="初級">初級</option>
                              <option value="中級">中級</option>
                              <option value="上級">上級</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[var(--foreground)] font-medium mb-2">備考・特記事項</label>
                          <textarea
                            value={studentNotes}
                            onChange={(e) => setStudentNotes(e.target.value)}
                            placeholder="例: 好きなもの、苦手なもの、アレルギー、特別な配慮が必要なことなど"
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setLessonType("")}
                      className="flex-1 px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Save student info to profile if needed
                        if (!isStudentBooker && studentName) {
                          // TODO: Save student info to user profile
                        }
                        setSubstep(2);
                      }}
                      disabled={!customerName || !customerKana || !customerEmail || (!isStudentBooker && !studentName)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Date and Time */}
              {substep === 2 && (
                <div className="bg-[var(--card)] border border-[var(--border)] p-4 lg:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-700 ease-out w-full lg:w-fit mx-auto lg:min-w-[400px]">
                  {/* Dynamic container that grows when date is selected */}
                  <div className={`flex flex-col lg:flex-row lg:gap-8 space-y-6 lg:space-y-0 w-full transition-all duration-700 ease-out ${
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
                        onClick={() => {
                          if (user) {
                            // For authenticated users, go back to lesson type selection
                            setLessonType("");
                            setSubstep(1);
                          } else {
                            // For non-authenticated users, go back to info step
                            setSubstep(1);
                          }
                        }}
                        className="w-full mt-4 px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hidden lg:block"
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
                              className="flex flex-col lg:flex-wrap gap-1 w-full lg:w-auto"
                              style={{
                                maxHeight: '450px', // Match calendar + return button height
                              }}
                            >
                              {getTimesForDate(selectedDate).map((slot) => (
                                <button
                                  key={slot.value}
                                  type="button"
                                  onClick={() => {
                                    if (!slot.disabled) {
                                      setSelectedTime(slot.value);
                                      // Auto-advance to payment step when time is selected
                                      setTimeout(() => setSubstep(3), 300);
                                    }
                                  }}
                                  disabled={slot.disabled}
                                  className={`
                                    px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border-2 lg:whitespace-nowrap relative shadow-sm w-full lg:w-40 flex-shrink-0 h-12
                                    ${slot.disabled
                                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 cursor-not-allowed opacity-80 line-through decoration-red-400 decoration-2'
                                      : selectedTime === slot.value
                                      ? 'bg-[#3881ff] text-white border-[#3881ff] shadow-lg ring-2 ring-[#3881ff]/30 transform scale-105 z-10'
                                      : 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:border-[#3881ff] hover:bg-[var(--muted)]/50 hover:shadow-md hover:transform hover:scale-105'
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
                            <div className="text-center py-8 text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg border border-[var(--border)] animate-fadeIn">
                              <div className="text-lg font-medium">この日は満席です</div>
                              <div className="text-sm mt-1">他の日を選択してください</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Return button for mobile - appears below timeslots */}
                  <div className="mt-8 lg:hidden flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (user) {
                          // For authenticated users, go back to lesson type selection
                          setLessonType("");
                          setSubstep(1);
                        } else {
                          // For non-authenticated users, go back to info step
                          setSubstep(1);
                        }
                      }}
                      className="w-full px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 3: Price and Payment */}
              {substep === 3 && (
                <form onSubmit={handleSubmit} className={`bg-[var(--card)] border border-[var(--border)] p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 w-full mx-auto ${
                  finalPrice === 0 ? 'max-w-2xl' : 'max-w-6xl'
                }`}>
                  <input type="hidden" name="lessonType" value={lessonType} />
                  <input type="hidden" name="name" value={customerName} />
                  <input type="hidden" name="kana" value={customerKana} />
                  <input type="hidden" name="email" value={customerEmail} />
                  <input type="hidden" name="participants" value={participants} />
                  
                  {/* Header */}
                  <div className="text-center mb-6 lg:mb-8">
                    <h3 className="text-2xl lg:text-3xl text-[var(--foreground)] font-bold mb-3">料金確認・お支払い</h3>
                    <div className="w-32 lg:w-40 h-1 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] mx-auto rounded-full"></div>
                  </div>
                  
                  {/* Mobile-first single column layout, desktop switches to two columns */}
                  <div className={`flex flex-col gap-4 ${finalPrice !== 0 ? 'lg:grid lg:grid-cols-2' : ''}`}>
                    
                    {/* Left Column - Summary & Coupon */}
                    <div className="space-y-6">
                      {/* Summary Card */}
                      <div className="bg-[var(--muted)]/30 p-4 lg:p-6 rounded-xl border border-[var(--border)]">
                        <h4 className="text-lg font-semibold text-[var(--foreground)] mb-4 text-center lg:text-left">予約内容</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/30">
                            <span className="text-[var(--muted-foreground)] font-medium">レッスン形式</span>
                            <span className="text-[var(--foreground)] font-semibold">{lessonType === 'online' ? 'オンライン' : '対面'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/30">
                            <span className="text-[var(--muted-foreground)] font-medium">参加者数</span>
                            <span className="text-[var(--foreground)] font-semibold">{participants}名</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/30">
                            <span className="text-[var(--muted-foreground)] font-medium">予約日時</span>
                            <span className="text-[var(--foreground)] font-semibold text-right">{selectedDate} {selectedTime}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-[var(--muted-foreground)] font-medium">合計金額</span>
                            <span className="text-[#3881ff] font-bold text-lg">{getDisplayPrice()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Coupon Section - Only show if not using free trial */}
                      {!isFreeTrialActive && (
                        <div>
                          <div className="flex flex-col sm:flex-row gap-3 -mt-1 mb-2">
                            <input
                              type="text"
                              value={coupon}
                              onChange={(e) => setCoupon(e.target.value)}
                              placeholder="クーポンコードを入力（任意）"
                              className="flex-1 px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                            />
                            <button
                              type="button"
                              onClick={() => setCouponConfirmed(true)}
                              disabled={!coupon || couponConfirmed || priceLoading}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md sm:flex-shrink-0"
                            >
                              {couponConfirmed ? "適用済み" : "適用"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Free Trial Notification */}
                      {isFreeTrialActive && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-200">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                              <div className="font-semibold text-lg">無料体験レッスン</div>
                              <div className="text-sm opacity-90">初回限定の無料体験レッスンが適用されています</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Payment Method */}
                    <div className="space-y-6">
                      {/* Saved Payment Methods for returning customers */}
                      {finalPrice !== 0 && savedPaymentMethods.length > 0 && (
                        <div>
                          <label className="block text-[var(--foreground)] font-semibold mb-4 text-center lg:text-left">保存済みのカード</label>
                          <div className="space-y-3">
                            {savedPaymentMethods.map((pm) => (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMethodId(pm.id);
                                  setPaymentMethod("card");
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                                  selectedPaymentMethodId === pm.id
                                    ? "border-[#3881ff] bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                    : "border-[var(--border)] bg-[var(--card)] hover:border-[#3881ff] hover:bg-[var(--muted)]/30"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                                    selectedPaymentMethodId === pm.id
                                      ? "bg-[#3881ff] text-white" 
                                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                  }`}>
                                    💳
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className={`font-semibold transition-colors duration-300 ${
                                      selectedPaymentMethodId === pm.id
                                        ? "text-[#3881ff]" 
                                        : "text-[var(--foreground)]"
                                    }`}>
                                      {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                                    </div>
                                    <div className="text-sm text-[var(--muted-foreground)] mt-1">
                                      有効期限: {pm.card.exp_month.toString().padStart(2, '0')}/{pm.card.exp_year}
                                    </div>
                                  </div>
                                  {selectedPaymentMethodId === pm.id && (
                                    <div className="w-6 h-6 bg-[#3881ff] rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-white text-sm">✓</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentMethodId(null);
                                setPaymentMethod("card");
                              }}
                              className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] hover:border-[#3881ff] hover:bg-[var(--muted)]/30 transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[var(--muted-foreground)]">➕</span>
                                </div>
                                <div className="text-left">
                                  <div className="font-semibold text-[var(--foreground)]">新しいカードを追加</div>
                                  <div className="text-sm text-[var(--muted-foreground)]">安全に保存されます</div>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Method Selection - Only show if not free */}
                      {finalPrice !== 0 && (savedPaymentMethods.length === 0 || !selectedPaymentMethodId) && (
                        <div>
                          <label className="block text-[var(--foreground)] font-semibold mb-1 text-center lg:text-left">お支払い方法を選択</label>
                          <div className="grid grid-cols-1 gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentMethod("card");
                              }}
                              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                                paymentMethod === "card"
                                  ? "border-[#3881ff] bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                  : "border-[var(--border)] bg-[var(--card)] hover:border-[#3881ff] hover:bg-[var(--muted)]/30"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                                  paymentMethod === "card" 
                                    ? "bg-[#3881ff] text-white" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                                }`}>
                                  💳
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`font-semibold transition-colors duration-300 ${
                                    paymentMethod === "card" 
                                      ? "text-[#3881ff]" 
                                      : "text-[var(--foreground)] group-hover:text-[#3881ff]"
                                  }`}>
                                    カード決済
                                  </div>
                                  <div className="text-sm text-[var(--muted-foreground)] mt-1">
                                    Visa, MasterCard, JCB
                                    {savedPaymentMethods.length === 0 && user && (
                                      <div className="text-green-600 dark:text-green-400">
                                        カード情報を保存して次回簡単決済
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {paymentMethod === "card" && (
                                  <div className="w-6 h-6 bg-[#3881ff] rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("cash")}
                              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                                paymentMethod === "cash"
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
                                  : "border-[var(--border)] bg-[var(--card)] hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                                  paymentMethod === "cash" 
                                    ? "bg-green-500 text-white" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:bg-green-100 dark:group-hover:bg-green-900/30"
                                }`}>
                                  💰
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`font-semibold transition-colors duration-300 ${
                                    paymentMethod === "cash" 
                                      ? "text-green-600 dark:text-green-400" 
                                      : "text-[var(--foreground)] group-hover:text-green-600 dark:group-hover:text-green-400"
                                  }`}>
                                    現金決済
                                  </div>
                                  <div className="text-sm text-[var(--muted-foreground)] mt-1">
                                    レッスン開始時
                                  </div>
                                </div>
                                {paymentMethod === "cash" && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>
                          
                          {/* Payment Information - Always visible to prevent layout shift */}
                          <div className="mt-4 p-4 bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[var(--foreground)]">ℹ️</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[var(--foreground)] mb-1">現金お支払いについて</div>
                                <div className="text-sm text-[var(--muted-foreground)] break-words">
                                  レッスン開始前に現金でのお支払いをお願いいたします。お釣りのないようご準備ください。
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Display */}
                      {formError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                            <span>⚠️</span>
                            <span className="font-medium">{formError}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Full Width */}
                  <div className={`flex flex-col pt-2 sm:flex-row gap-4 ${finalPrice === 0 ? 'mx-auto max-w-md' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setSubstep(2)}
                      className={`px-6 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${
                        finalPrice === 0 ? 'flex-1' : 'flex-1'
                      }`}
                    >
                      戻る
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className={`px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md ${
                        finalPrice === 0 ? 'flex-1' : 'flex-1'
                      }`}
                    >
                      {formLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>処理中...</span>
                        </div>
                      ) : finalPrice === 0 ? (
                        "予約を確定する"
                      ) : paymentMethod === "cash" ? (
                        "現金予約を確定する"
                      ) : (
                        "お支払いに進む"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          {step === 2 && clientSecret && (
            <div
              className="bg-[var(--card)] border border-[var(--border)] p-6 lg:p-8 rounded-2xl shadow-lg w-full max-w-2xl mx-auto hover:shadow-xl transition-all duration-300"
              id="payment-form-container"
              ref={paymentFormRef}
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
                        border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#d1d5db'}`,
                        borderRadius: '8px',
                        padding: '12px 16px',
                        margin: '8px 0',
                        background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                      },
                      '.TabContainer': {
                        display: 'flex !important',
                        visibility: 'visible !important',
                        flexDirection: 'column',
                        gap: '8px',
                      },
                      '.PaymentMethodSelector': {
                        display: 'block !important',
                        visibility: 'visible !important',
                        background: resolvedTheme === 'dark' ? '#111827' : '#f9fafb',
                        border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        padding: '16px',
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
            <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl shadow-lg w-full flex flex-col items-center gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] justify-center hover:shadow-xl transition-all duration-300">
              <svg className="w-16 h-16 text-green-500 mb-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-green-600 dark:text-green-400 font-bold text-2xl mb-2">予約完了!</div>
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
