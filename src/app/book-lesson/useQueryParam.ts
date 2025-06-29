// src/app/book-lesson/useQueryParam.ts
// Simple hook to get a query param value from the URL (client-side only)
import { useEffect, useState } from "react";

export function useQueryParam(key: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setValue(params.get(key));
    }
  }, [key]);
  return value;
}
