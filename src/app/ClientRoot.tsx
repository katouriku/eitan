"use client";

import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import "./globals.css";
import { LoadingProvider } from "../contexts/LoadingContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import Header from "../components/Header";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  // Navigation state
  const [nav, setNav] = useState([
    { label: "レッスンを予約", href: "/book-lesson" },
    { label: "方法", href: "/method" },
    { label: "料金", href: "/pricing" },
    { label: "私について", href: "/about-me" },
    { label: "お問い合わせ", href: "/contact" },
  ]);
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  // Hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Free trial eligibility state (no banner, just for button text)
  const [isEligibleForFreeTrial, setIsEligibleForFreeTrial] = useState(false);

  // Check if user is eligible for free trial
  useEffect(() => {
    const hasBookedBefore = Cookies.get("user_has_booked") === "true";
    setIsEligibleForFreeTrial(!hasBookedBefore);
  }, []);

  // Fetch navigation from Sanity (memoized)
  const fetchNav = useCallback(async () => {
    try {
      const data = await client.fetch(
        groq`*[_type == "navigation"][0]{items[]{label, href}}`
      );
      if (data?.items) setNav(data.items);
    } catch {
      // Handle error
    }
  }, []);

  useEffect(() => {
    fetchNav();
  }, [fetchNav]);

  // Homepage content state
  const [homepage, setHomepage] = useState({
    mainTitle: "エイタン",
    subtitle: "",
    description:
      "",
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
    return (
      <ThemeProvider>
        <AuthProvider>
          <LoadingProvider>
          <div className="min-h-screen w-full flex flex-col bg-[var(--background)]">
            <Header 
              homepage={homepage}
              nav={nav}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
            
            {/* Progress Bar for Book Lesson Page - inline positioning */}
            {pathname === '/book-lesson' && (
              <div className="mt-16 w-full bg-transparent">
                <div id="progress-bar-container" className="max-w-7xl mx-auto bg-transparent">
                  {/* Progress bar will be rendered here by the booking page */}
                </div>
              </div>
            )}
            
            <main className="flex-1 flex flex-col min-h-0">
              {pathname === "/" ? (
                <section className="flex-1 relative min-h-0">
                  <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#3881ff] mb-4 leading-tight"
                          style={{textShadow:'0 4px 20px rgba(56,129,255,0.30)'}}>
                        {homepage.mainTitle}
                      </h1>
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-4 leading-relaxed">
                        {homepage.subtitle}
                      </h2>
                      <p className="text-base sm:text-lg md:text-xl text-[var(--muted-foreground)] mb-10 leading-relaxed max-w-3xl mx-auto">
                        {homepage.description}
                      </p>
                      <Link
                        href={isEligibleForFreeTrial ? "/book-lesson?freeTrial=true" : nav[0].href}
                        className="inline-block px-6 sm:px-8 mt-2 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg md:text-xl bg-gradient-to-r from-[#3881ff] to-[#5a9eff] text-white shadow-xl hover:from-[#5a9eff] hover:to-[#3881ff] hover:scale-105 transition-all duration-300 border-2 border-[#3881ff]/50 focus:outline-none"
                        style={{textShadow:'0 2px 8px rgba(0,0,0,0.20)', color: 'white'}}
                      >
                        {isEligibleForFreeTrial ? "無料レッスンを予約" : nav[0].label}
                      </Link>
                    </div>
                  </div>
                </section>
              ) : pathname === '/book-lesson' ? (
                <section className="flex-1 relative min-h-0">
                  {/* Main content - centered vertically like sidebar */}
                  <div className="px-4 sm:px-6 py-4 lg:flex lg:items-center lg:justify-center lg:min-h-full">
                    <div className="w-full max-w-4xl mx-auto">
                      {children}
                    </div>
                  </div>
                  
                  {/* Fixed sidebar on far right - desktop only, always visible */}
                  <div id="booking-sidebar-container" className="hidden lg:block fixed top-1/2 right-6 transform -translate-y-1/2 z-20 w-72">
                    {/* Sidebar content will be rendered here by the booking page */}
                  </div>
                </section>
              ) : (
                <section className="flex-1 px-4 sm:px-6 overflow-y-auto min-h-0 pt-20 sm:pt-24 md:pt-20 flex items-center justify-center">
                  <div className="max-w-4xl mx-auto w-full py-6 sm:py-8">
                    {children}
                  </div>
                </section>
              )}
            </main>
            {/* Footer */}
            <footer className="w-full px-4 sm:px-6 py-4 sm:py-6 bg-[var(--background)] border-t border-[var(--border)] flex-shrink-0">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center gap-2">
                  <span>メール:</span>
                  <a href="mailto:luke@eigotankentai.com" className="text-[#3881ff] hover:text-[#5a9eff] transition-colors">
                    luke@eigotankentai.com
                  </a>
                </div>
                <Link 
                  href="/tokutei-shouhiki-hou" 
                  className="text-[#3881ff] hover:text-[#5a9eff] transition-colors"
                >
                  特定商取引法に基づく表記
                </Link>
              </div>
              {/* Fixed Theme Toggle - positioned in bottom right */}
              <ThemeToggle />
            </footer>
          </div>
        </LoadingProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  }

  // Studio pages - render children directly without layout
  return children;
}
