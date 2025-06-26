"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Cookies from "js-cookie";
import "../globals.css";

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

export default function BookLessonPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);
  const [showInfoRetrieved, setShowInfoRetrieved] = useState(false);

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
    if (savedName && savedEmail && savedDate && savedTime) {
      setSelectedDate(savedDate);
      setSelectedTime(savedTime);
      setShowInfoRetrieved(true);
      setTimeout(() => {
        // Immediately create payment intent and go to payment step
        (async () => {
          setFormLoading(true);
          try {
            const res = await fetch("/api/create-payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: 4000, currency: "jpy" }),
            });
            const data = await res.json();
            if (data.clientSecret) {
              setClientSecret(data.clientSecret);
              setStep(2);
            } else {
              setFormError(data.error || "Failed to create payment session.");
              setStep(1);
            }
          } catch {
            setFormError("An error occurred. Please try again.");
            setStep(1);
          } finally {
            setFormLoading(false);
            setShowInfoRetrieved(false);
          }
        })();
      }, 1200); // Show checkmark for 1.2s
    }
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
      let current = new Date(d);
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
    Cookies.set("booking_name", (e.currentTarget.name as any)?.value || "", { expires: 7 });
    Cookies.set("booking_email", (e.currentTarget.email as any)?.value || "", { expires: 7 });
    Cookies.set("booking_date", selectedDate, { expires: 7 });
    Cookies.set("booking_time", selectedTime, { expires: 7 });
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 4000, currency: "jpy" }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep(2);
      } else {
        setFormError(data.error || "Failed to create payment session.");
      }
    } catch (err) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen">
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center w-full min-h-0 min-w-0 max-h-full px-6 py-10 gap-12">
        <div className="flex flex-col items-center justify-center max-w-2xl min-w-[340px] w-full order-2 md:order-none min-h-0">
          <span
            className="font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#3881ff] mb-8 text-center w-full"
            style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}
          >
            Book a Lesson
          </span>
          {showInfoRetrieved && (
            <div className="flex flex-col items-center justify-center mb-8 animate-fade-in">
              <svg className="w-12 h-12 text-green-400 mb-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-green-400 font-bold text-lg">Your information was retrieved!</div>
            </div>
          )}
          {step === 1 && (
            <form className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full border-2 border-[#3881ff] flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0" onSubmit={handleSubmit}>
              <input name="name" required placeholder="Name" defaultValue={Cookies.get("booking_name") || ""} className="p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]" />
              <input name="email" required type="email" placeholder="Email" defaultValue={Cookies.get("booking_email") || ""} className="p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]" />
              <div>
                <label className="block text-gray-200 mb-2">Select Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                  }}
                  required
                  className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                >
                  <option value="">-- Select a date --</option>
                  {getAvailableDates().map((date) => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-200 mb-2">Select Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                  disabled={!selectedDate}
                >
                  <option value="">-- Select a time --</option>
                  {getTimesForDate(selectedDate).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              {formError && <div className="text-red-400 font-bold">{formError}</div>}
              <button type="submit" className="mt-4 px-8 py-3 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50" disabled={formLoading}>
                {formLoading ? "Loading..." : "Continue to Payment"}
              </button>
            </form>
          )}
          {step === 2 && clientSecret && (
            <div className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full border-2 border-[#3881ff] flex flex-col gap-6 max-w-lg mx-auto min-h-0 min-w-0">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
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
                <PaymentElement options={{paymentMethodOrder: ['card', 'konbini', 'google_pay'], defaultValues: { paymentMethod: 'card' }}} />
              </Elements>
              <div className="text-gray-400 text-center mt-4 text-sm">Complete payment to confirm your booking.</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
