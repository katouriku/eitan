"use client";

import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

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
        <header className="w-full px-4 sm:px-6 py-3 bg-[#18181b]/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-40 border-b border-gray-800">
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
                  className="px-4 xl:px-5 py-2.5 rounded-xl font-medium text-sm xl:text-base text-gray-300 bg-gray-800/50 border border-gray-700 hover:text-white hover:bg-[#3881ff]/90 hover:border-[#3881ff] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[#3881ff]/30"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
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
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#18181b] border-l border-gray-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-[#3881ff]">メニュー</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
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
                    className="px-4 py-3 rounded-xl font-medium text-gray-300 bg-gray-800/50 border border-gray-700 hover:text-white hover:bg-[#3881ff]/90 hover:border-[#3881ff] transition-all duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
        <main className="flex-1 flex flex-col pt-20 sm:pt-24 min-h-0">
          {pathname === "/" ? (
            <section className="flex-1 flex items-center justify-center px-4 sm:px-6 min-h-0">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#3881ff] mb-4 sm:mb-6 leading-tight"
                    style={{textShadow:'0 4px 20px rgba(56,129,255,0.30)'}}>
                  {homepage.mainTitle}
                </h1>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 leading-relaxed">
                  {homepage.subtitle}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                  {homepage.description}
                </p>
                <Link
                  href={nav[0].href}
                  className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg md:text-xl bg-gradient-to-r from-[#3881ff] to-[#5a9eff] text-white shadow-xl hover:from-[#5a9eff] hover:to-[#3881ff] hover:scale-105 transition-all duration-300 border-2 border-[#3881ff]/50 hover:border-[#5a9eff] focus:outline-none focus:ring-4 focus:ring-blue-200/50"
                  style={{textShadow:'0 2px 8px rgba(0,0,0,0.20)'}}
                >
                  {nav[0].label}
                </Link>
              </div>
            </section>
          ) : (
            <section className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto min-h-0">
              <div className="max-w-4xl mx-auto">
                {children}
              </div>
            </section>
          )}
        </main>
        {/* Footer */}
        <footer className="w-full px-4 sm:px-6 py-4 sm:py-6 bg-[#18181b] border-t border-gray-800 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm text-gray-400">
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
        </footer>
      </div>
    );
  }

  // For /studio and other special routes, just render children
  return <>{children}</>;
}
