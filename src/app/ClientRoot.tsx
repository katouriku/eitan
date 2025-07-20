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
import ThemeToggle from "../components/ThemeToggle";

// Hamburger menu icon component
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center w-6 h-6">
      <span className={`block h-0.5 w-5 bg-[#3881ff] rounded transition-all duration-200 ease-in-out ${
        open ? "rotate-45 translate-y-1.5" : ""
      }`} />
      <span className={`block h-0.5 w-5 bg-[#3881ff] rounded my-1 transition-all duration-200 ease-in-out ${
        open ? "opacity-0" : ""
      }`} />
      <span className={`block h-0.5 w-5 bg-[#3881ff] rounded transition-all duration-200 ease-in-out ${
        open ? "-rotate-45 -translate-y-1.5" : ""
      }`} />
    </div>
  );
}

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
        <LoadingProvider>
          <div className="min-h-screen w-full flex flex-col bg-[var(--background)]">
            <header className="w-full px-4 sm:px-6 py-3 bg-[var(--background)]/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-40 border-b border-[var(--border)]">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#3881ff] hover:text-[#5a9eff] transition-colors"
                      style={{textShadow:'0 2px 12px rgba(56,129,255,0.20)'}}>
                    {homepage.mainTitle}
                  </h1>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-4 xl:px-5 py-2.5 rounded-xl font-medium text-sm xl:text-base text-[var(--muted-foreground)] bg-[var(--muted)]/50 border border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[#3881ff]/90 hover:border-[#3881ff] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#3881ff]/30"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                  aria-label="Toggle menu"
                  onClick={() => setMenuOpen(!menuOpen)}
                  type="button"
                >
                  <HamburgerIcon open={menuOpen} />
                </button>
              </div>
            </header>
            {/* Mobile Menu Overlay */}
            {menuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
                <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[var(--background)] border-l border-[var(--border)] p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-[#3881ff]">メニュー</h2>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                      aria-label="Close menu"
                    >
                      <HamburgerIcon open={true} />
                    </button>
                  </div>
                  <nav className="flex flex-col gap-3">
                    {nav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="px-4 py-3 rounded-xl font-medium text-[var(--muted-foreground)] bg-[var(--muted)]/50 border border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[#3881ff]/90 hover:border-[#3881ff] transition-all duration-300"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            )}
            
            {/* Progress Bar for Book Lesson Page */}
            {pathname === '/book-lesson' && (
              <div className="mt-16 lg:fixed left-0 right-0 z-30">
                <div id="progress-bar-container" className="max-w-7xl mx-auto bg-transparent py-2">
                  {/* Progress bar will be rendered here by the booking page */}
                </div>
              </div>
            )}
            
            <main className={`flex-1 flex flex-col min-h-0 ${pathname === '/book-lesson' ? 'pt-8 md:pt-0' : 'pt-0'}`}>
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
                <section className="flex-1 relative min-h-0 pt-8">
                  {/* Main content - mobile: starts right after progress bar, desktop: centered */}
                  <div className="px-4 sm:px-6 py-4 lg:flex lg:items-center lg:justify-center lg:min-h-full lg:py-8 lg:pt-40">
                    <div className="w-full max-w-4xl mx-auto -mt-20 lg:-mt-0">
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
      </ThemeProvider>
    );
  }

  // Studio pages - render children directly without layout
  return children;
}
