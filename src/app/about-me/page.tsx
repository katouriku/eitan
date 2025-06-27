"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import "../globals.css";

export default function AboutMePage() {
  const [about, setAbout] = useState<{ bio: string; headshot?: { asset?: { url: string } } | null }>({
    bio: "",
    headshot: null,
  });

  useEffect(() => {
    async function fetchAbout() {
      const data = await client.fetch(
        groq`*[_type == "about"][0]{bio, headshot}`
      );
      setAbout(data || { bio: "", headshot: null });
    }
    fetchAbout();
  }, []);

  return (
    <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen">
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center w-full min-h-0 min-w-0 max-h-full px-6 py-10 gap-12">
        {about.headshot && (
          <div className="flex-shrink-0 relative aspect-[413/531] w-64 md:w-80 rounded-2xl overflow-hidden order-1 md:order-none min-h-0 min-w-0">
            <Image
              src={urlFor(about.headshot).width(413).height(531).url()}
              alt="Headshot"
              fill
              className="object-cover w-full h-full rounded-2xl border-none"
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        )}
        <div className="flex flex-col items-start justify-center max-w-2xl w-full order-2 md:order-none min-h-0 min-w-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3881ff] mb-4 text-left whitespace-nowrap" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>About Me</h1>
          <p className="text-lg text-gray-100 text-left leading-relaxed mb-6">
            {about.bio}
          </p>
          <Link href="/book-lesson" className="px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b]" style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}>Book a Lesson</Link>
        </div>
      </section>
    </main>
  );
}
