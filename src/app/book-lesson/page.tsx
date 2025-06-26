"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

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

  useEffect(() => {
    async function fetchAvailability() {
      const data = await client.fetch(groq`*[_type == "availability"][0]{weeklyAvailability}`);
      setWeeklyAvailability(data?.weeklyAvailability || []);
    }
    fetchAvailability();
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
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 4000, currency: "jpy" }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
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
    <main className="backdrop-blur-lg bg-[#18181b]/90 rounded-2xl shadow-2xl flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 max-w-2xl mx-auto mt-12 data-[theme=light]:text-gray-900">
      <h1 className="text-3xl font-extrabold text-gray-100 data-[theme=light]:text-gray-900 mb-8 drop-shadow-lg">Book a Lesson</h1>
      <form className="bg-[#18181b] data-[theme=light]:bg-white p-8 rounded-2xl shadow-2xl w-full border-2 border-[#6366f1] data-[theme=light]:border-[#6366f1]/30 flex flex-col gap-6 max-w-lg mx-auto" onSubmit={handleSubmit}>
        <input name="name" required placeholder="Name" className="p-3 rounded-lg border border-[#31313a] data-[theme=light]:border-[#e0e7eb] bg-[#23232a] data-[theme=light]:bg-[#f7f7fa] text-gray-100 data-[theme=light]:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366f1]" />
        <input name="email" required type="email" placeholder="Email" className="p-3 rounded-lg border border-[#31313a] data-[theme=light]:border-[#e0e7eb] bg-[#23232a] data-[theme=light]:bg-[#f7f7fa] text-gray-100 data-[theme=light]:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366f1]" />
        <div>
          <label className="block text-gray-200 data-[theme=light]:text-gray-700 mb-2">Select Date</label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime("");
            }}
            required
            className="w-full p-3 rounded-lg border border-[#31313a] data-[theme=light]:border-[#e0e7eb] bg-[#23232a] data-[theme=light]:bg-[#f7f7fa] text-gray-100 data-[theme=light]:text-gray-900 mb-2"
          >
            <option value="">-- Select a date --</option>
            {getAvailableDates().map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-200 data-[theme=light]:text-gray-700 mb-2">Select Time</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-[#31313a] data-[theme=light]:border-[#e0e7eb] bg-[#23232a] data-[theme=light]:bg-[#f7f7fa] text-gray-100 data-[theme=light]:text-gray-900"
            disabled={!selectedDate}
          >
            <option value="">-- Select a time --</option>
            {getTimesForDate(selectedDate).map((time) => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
        {formError && <div className="text-red-400 font-bold">{formError}</div>}
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#6366f1', colorBackground: '#18181b', colorText: '#fff', borderRadius: '12px' } } }}>
            <PaymentElement />
          </Elements>
        )}
        <button type="submit" className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white data-[theme=light]:text-white font-extrabold text-lg shadow-lg hover:scale-105 hover:from-[#818cf8] hover:to-[#6366f1] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#6366f1]/50" disabled={formLoading || !!clientSecret}>
          {formLoading ? "Loading..." : clientSecret ? "Payment Ready" : "Book & Pay"}
        </button>
      </form>
    </main>
  );
}
