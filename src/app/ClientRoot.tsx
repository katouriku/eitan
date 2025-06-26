"use client";

import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  // Navigation state
  const [nav, setNav] = useState([
    { label: "Book Lesson", href: "/book-lesson" },
    { label: "Method", href: "/method" },
    { label: "Pricing", href: "/pricing" },
    { label: "About Me", href: "/about-me" },
  ]);
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState(false);

  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  // Fetch navigation from Sanity (memoized)
  const fetchNav = useCallback(async () => {
    setNavLoading(true);
    setNavError(false);
    try {
      const data = await client.fetch(
        groq`*[_type == "navigation"][0]{items[]{label, href}}`
      );
      if (data?.items) setNav(data.items);
    } catch {
      setNavError(true);
    } finally {
      setNavLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNav();
  }, [fetchNav]);

  // Homepage content state
  const [homepage, setHomepage] = useState({
    mainTitle: "エイタン",
    subtitle: "Start your English journey today!",
    description:
      "Friendly, modern English lessons focused on conversation, confidence, and real-world skills. Book a lesson or explore more below.",
  });

  // Fetch homepage content from Sanity
  useEffect(() => {
    async function fetchHomepage() {
      try {
        const data = await client.fetch(
          groq`*[_type == "homepage"][0]{mainTitle, subtitle, description}`
        );
        if (data) setHomepage(data);
      } catch {}
    }
    fetchHomepage();
  }, []);

  // Home page UI
  // Use the same header for all pages except /studio
  if (!isStudio) {
    // Flat dark gray background for the entire site, including header
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#18181b]">
        <header className="w-full flex items-center justify-between px-6 py-6 md:py-8 bg-transparent fixed top-0 left-0 right-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center select-none m-0 mb-2 flex flex-wrap items-center justify-center gap-x-2">
              <Link href="/"><span className="text-[#3881ff]" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>{homepage.mainTitle}</span></Link>
            </h1>
          </div>
          <nav className="flex gap-4 md:gap-6 items-center">
            {nav.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="px-6 py-2 rounded-full font-bold text-base md:text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b]"
                style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 w-full flex flex-col pt-[88px]">
          {pathname === "/" ? (
            <section className="flex flex-1 flex-col items-center justify-center w-full min-h-[calc(100vh-88px)]">
              <div className="max-w-xl w-full flex flex-col items-center justify-center mt-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3881ff] mb-4 text-center">{homepage.subtitle}</h2>
                <p className="text-lg sm:text-xl text-gray-200 mb-8 text-center">
                  {homepage.description}
                </p>
                <Link
                  href={nav[0].href}
                  aria-label={nav[0].label}
                  className="w-full sm:w-auto px-10 py-5 rounded-full font-extrabold text-2xl uppercase tracking-wide bg-[#3881ff] text-white shadow-xl border border-[#3881ff] hover:scale-105 hover:shadow-2xl transition-all text-center mb-6 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b]"
                  style={{textShadow:'0 2px 12px rgba(56,129,255,0.13)'}}
                >
                  {nav[0].label}
                </Link>
              </div>
            </section>
          ) : (
            <section className="flex flex-1 flex-col items-center justify-center w-full min-h-[calc(100vh-88px)] px-4 py-8">
              <div className="max-w-2xl w-full flex flex-col items-center justify-center mt-2">
                {children}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  // For /studio and other special routes, just render children
  return <>{children}</>;
}
