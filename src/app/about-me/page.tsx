"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import "../globals.css";

export default function AboutMePage() {
  const [about, setAbout] = useState<{ bio: PortableTextBlock[]; headshot?: { asset?: { url: string } } | null }>({
    bio: [],
    headshot: null,
  });

  useEffect(() => {
    async function fetchAbout() {
      const data = await client.fetch(
        groq`*[_type == "about"][0]{bio, headshot}`
      );
      setAbout({
        bio: Array.isArray(data?.bio) ? data.bio : [],
        headshot: data?.headshot || null,
      });
    }
    fetchAbout();
  }, []);

  // Show loading state until Sanity content is ready
  if (!about || (!about.bio && !about.headshot)) {
    return (
      <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen">
        <div className="text-2xl text-gray-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen">
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center w-full min-h-0 min-w-0 max-h-full px-6 py-10 gap-12">
        {about.headshot && (
          <div className="flex-shrink-0 relative aspect-[413/531] w-64 md:w-80 rounded-2xl overflow-hidden self-center md:self-auto min-h-0 min-w-0">
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
        <div className="flex flex-col items-start justify-center flex-1 min-h-0 min-w-150 w-full text-wrap">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3881ff] mb-4 text-left whitespace-nowrap" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>About Me</h1>
          <div className="prose prose-lg prose-invert mb-6 w-full">
            <PortableText value={Array.isArray(about.bio) ? about.bio : []} />
          </div>
          <Link href="/book-lesson" className="flex items-center justify-center px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b] text-center" style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}>Book a Lesson</Link>
        </div>
      </section>
    </main>
  );
}
