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

  // Home page UI
  if (!isStudio && pathname === "/") {
    return (
      <main className="relative min-h-screen h-screen w-screen flex items-center justify-center overflow-hidden">
        {/* Centered Site Name with background - move to top on mobile */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-full px-2 xs:px-0 sm:left-1/2 sm:top-1/2 xs:left-1/2 xs:top-6 xs:-translate-x-1/2 xs:-translate-y-0">
          <div className="rounded-2xl bg-[#18181b]/80 px-4 py-4 xs:px-10 xs:py-6 shadow-2xl border border-cyan-400/10 backdrop-blur-xl w-full max-w-xs xs:max-w-lg md:max-w-2xl">
            <h1 className="transition-opacity duration-500 opacity-100 text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-center text-white select-none m-0 flex flex-wrap items-center justify-center gap-x-2">
              <span className="bg-gradient-to-br from-blue-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent" style={{textShadow:'0 2px 8px rgba(0,180,216,0.10)'}}>英</span>
              <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl align-super font-bold ml-1 mr-2 text-cyan-300" style={{lineHeight:1}}>(エイ)</span>
              <span className="bg-gradient-to-br from-blue-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent" style={{textShadow:'0 2px 8px rgba(0,180,216,0.10)'}}>探</span>
              <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl align-super font-bold ml-1 mr-2 text-teal-300" style={{lineHeight:1}}>(タン)</span>
              <span className="bg-gradient-to-br from-blue-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent" style={{textShadow:'0 2px 8px rgba(0,180,216,0.10)'}}>検隊</span>
            </h1>
          </div>
        </div>
        {/* 4 Absolutely Positioned Buttons - Responsive for mobile */}
        {nav.slice(0, 4).map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={
              [
                i === 0 && "absolute top-0 left-0 w-1/2 h-1/2 sm:w-1/2 sm:h-1/2 xs:static xs:w-full xs:h-1/4",
                i === 1 && "absolute top-0 right-0 w-1/2 h-1/2 sm:w-1/2 sm:h-1/2 xs:static xs:w-full xs:h-1/4 xs:mt-0 xs:top-auto xs:left-auto",
                i === 2 && "absolute bottom-0 left-0 w-1/2 h-1/2 sm:w-1/2 sm:h-1/2 xs:static xs:w-full xs:h-1/4 xs:mt-0 xs:top-auto xs:left-auto",
                i === 3 && "absolute bottom-0 right-0 w-1/2 h-1/2 sm:w-1/2 sm:h-1/2 xs:static xs:w-full xs:h-1/4 xs:mt-0 xs:top-auto xs:left-auto",
                "text-2xl md:text-3xl font-bold rounded-none shadow-xl transition-all duration-200 flex items-center justify-center z-10 cursor-pointer",
                // Uniform, soft blue-cyan-teal gradients for all quadrants
                i === 0 && "bg-gradient-to-br from-blue-700 via-cyan-600 to-teal-500 text-white ring-1 ring-cyan-300/20 hover:ring-4 hover:ring-cyan-200/40 hover:bg-cyan-800/40 hover:backdrop-blur-md hover:text-cyan-100",
                i === 1 && "bg-gradient-to-bl from-cyan-600 via-blue-500 to-teal-400 text-white ring-1 ring-blue-300/20 hover:ring-4 hover:ring-blue-200/40 hover:bg-blue-700/40 hover:backdrop-blur-md hover:text-cyan-100",
                i === 2 && "bg-gradient-to-tr from-teal-600 via-cyan-500 to-blue-400 text-white ring-1 ring-teal-300/20 hover:ring-4 hover:ring-teal-200/40 hover:bg-teal-700/40 hover:backdrop-blur-md hover:text-cyan-100",
                i === 3 && "bg-gradient-to-tl from-cyan-500 via-teal-400 to-blue-300 text-white ring-1 ring-cyan-200/20 hover:ring-4 hover:ring-cyan-100/40 hover:bg-cyan-600/40 hover:backdrop-blur-md hover:text-cyan-100",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="drop-shadow-lg tracking-tight flex items-center gap-2 text-base xs:text-lg sm:text-2xl md:text-3xl">
              {item.label}
            </span>
          </Link>
        ))}
        {/* Loading/Error States for nav fetch */}
        {navLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cyan-200 text-sm bg-[#23232a]/80 px-4 py-2 rounded shadow-lg">
            Loading navigation…
          </div>
        )}
        {navError && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-red-300 text-sm bg-[#23232a]/80 px-4 py-2 rounded shadow-lg">
            Navigation failed to load. Using defaults.
          </div>
        )}
      </main>
    );
  }

  // Header for all other pages (not /studio)
  if (!isStudio) {
    return (
      <>
        <header className="w-full flex items-center justify-center px-8 py-6 border-b border-[#23232a]/40 bg-[#23232a]/60 backdrop-blur-md sticky top-0 z-50 shadow-md">
          <nav className="flex gap-8 items-center w-full max-w-4xl justify-between">
            <ul className="flex gap-6 list-none m-0 p-0">
              {nav.slice(0, 2).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className="no-underline text-gray-100 font-semibold transition-colors hover:text-white px-4 py-2 rounded-lg bg-[#23232a] shadow-lg hover:bg-[#31313a] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 focus:ring-offset-[#18181b] cursor-pointer"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/"
              aria-label="Go to home page"
              className="font-extrabold text-2xl tracking-wide text-gray-100 px-4 py-1 shadow-none bg-transparent no-underline focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 focus:ring-offset-[#18181b] cursor-pointer"
            >
              エイ
            </Link>
            <div className="hidden xs:block">
              <Link
                href="/book-lesson"
                aria-label="Book Lesson"
                className="no-underline text-gray-100 font-semibold transition-colors hover:text-white px-4 py-2 rounded-lg bg-[#23232a] shadow-lg hover:bg-[#31313a] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 focus:ring-offset-[#18181b] cursor-pointer"
              >
                Book Lesson
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </>
    );
  }

  // For /studio and other special routes, just render children
  return <>{children}</>;
}
