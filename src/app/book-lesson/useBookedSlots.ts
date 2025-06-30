import { useEffect, useState } from "react";

export function useBookedSlots(date: string) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  useEffect(() => {
    if (!date) return;
    fetch(`/api/booking?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.bookings)) {
          // Extract booked times in "HH:mm" format
          setBookedSlots(
            data.bookings.map((b: { date: string }) => {
              const d = new Date(b.date);
              return d.toISOString().slice(11, 16); // "HH:mm"
            })
          );
        }
      });
  }, [date]);
  return bookedSlots;
}
