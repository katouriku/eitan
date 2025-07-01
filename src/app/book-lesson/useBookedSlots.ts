import { useEffect, useState } from "react";

interface BookedSlot {
  date: string;
  duration: number;
  participants: number;
}

export function useBookedSlots(date: string) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!date) return;
    
    setLoading(true);
    fetch(`/api/booking?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.bookings)) {
          // Extract booked times in "HH:mm" format
          const slots = data.bookings.map((booking: BookedSlot) => {
            const d = new Date(booking.date);
            return d.toISOString().slice(11, 16); // "HH:mm"
          });
          setBookedSlots(slots);
        }
      })
      .catch((error) => {
        console.error('Error fetching booked slots:', error);
        setBookedSlots([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [date]);
  
  return { bookedSlots, loading };
}

// Hook to check if a specific time slot is available
export function useAvailabilityCheck() {
  const [checking, setChecking] = useState(false);
  
  const checkAvailability = async (date: string, duration: number = 60): Promise<boolean> => {
    setChecking(true);
    try {
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, duration }),
      });
      
      const data = await response.json();
      return data.available || false;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    } finally {
      setChecking(false);
    }
  };
  
  return { checkAvailability, checking };
}
