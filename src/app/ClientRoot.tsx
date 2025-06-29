"use client";

import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

// Add: Hamburger menu state
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center w-8 h-8">
      <span className={`block h-1 w-6 bg-[#3881ff] rounded transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`}></span>
      <span className={`block h-1 w-6 bg-[#3881ff] rounded my-1 transition-all duration-200 ${open ? "opacity-0" : ""}`}></span>
      <span className={`block h-1 w-6 bg-[#3881ff] rounded transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`}></span>
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
  ]);
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  // Hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="min-h-screen w-full flex flex-col bg-[#18181b]">
        <header
          className="w-full px-6 py-2 bg-transparent fixed top-0 left-0 right-0 z-40 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center"
          style={{ backgroundColor: "rgba(24,24,27,0.85)" }}
        >
          {/* Hamburger: mobile only, absolutely positioned */}
          <button
            className="sm:hidden flex items-center justify-center absolute left-6 top-1/2 -translate-y-1/2"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <HamburgerIcon open={false} />
          </button>
          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center select-none m-0 mb-2 flex flex-wrap items-center justify-center gap-x-2 w-full sm:w-auto sm:mb-0">
            <Link href="/"><span className="text-[#3881ff]" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>{homepage.mainTitle}</span></Link>
          </h1>
          {/* Desktop nav (top right) */}
          <nav className="hidden sm:flex gap-4 md:gap-6 items-center mt-2 sm:mt-0 sm:ml-0 sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2">
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
        {/* Hamburger menu overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-[#18181b] bg-opacity-95 flex flex-col items-center justify-center sm:hidden transition-all">
            <button
              className="absolute top-6 left-6"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              type="button"
            >
              <HamburgerIcon open={true} />
            </button>
            <nav className="flex flex-col gap-8 mt-12">
              {nav.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="text-3xl font-bold text-[#3881ff] hover:text-white transition-all text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
        <main className="flex-grow w-full flex flex-col pt-20">
          {pathname === "/" ? (
            <section className="flex flex-1 flex-col items-center justify-center w-full h-full">
              <div className="w-full flex flex-col items-center justify-center mt-2">
                {/* Main text, always centered, max-w-xl for all screens */}
                <div className="flex flex-col items-center w-full max-w-xl">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3881ff] mb-4 text-center break-words">{homepage.subtitle}</h2>
                  <p className="text-lg sm:text-xl text-gray-200 mb-8 text-center break-words">
                    {homepage.description}
                  </p>
                </div>
                {/* Book Now button below main text on mobile and desktop */}
                <div className="w-full flex flex-col items-center mb-8">
                  <Link
                    href={nav[0].href}
                    aria-label={nav[0].label}
                    className="px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold sm:font-extrabold text-lg sm:text-2xl uppercase tracking-wide bg-[#3881ff] text-white shadow-md sm:shadow-xl border border-[#3881ff] hover:scale-105 hover:shadow-lg sm:hover:shadow-2xl transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b] mb-0"
                    style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}>
                    {nav[0].label}
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <section className="flex flex-col items-center justify-center w-full px-4 py-8 flex-1">
              <div className="max-w-2xl w-full flex flex-col items-center justify-center mt-2">
                {children}
              </div>
            </section>
          )}
        </main>
        {/* Footer with contact email and legal link */}
        <footer className="w-full px-6 pb-4 bg-transparent text-gray-400 text-sm flex flex-col sm:flex-row items-center sm:items-center justify-between pointer-events-auto">
          <div className="flex flex-row items-center gap-4 order-2 sm:order-1 mt-2 sm:mt-0">
            <Link href="/tokutei-shouhiki-hou" className="text-[#3881ff] hover:underline">特定商取引法に基づく表記</Link>
          </div>
          <div className="flex flex-row items-center order-1 sm:order-2">
            <span className="mr-1">メール:</span>
            <a href="mailto:lucaswilsoncontact@gmail.com" className="text-[#3881ff] hover:underline">luke@eigotankentai.com</a>
          </div>
        </footer>
      </div>
    );
  }

  // For /studio and other special routes, just render children
  return <>{children}</>;
}
