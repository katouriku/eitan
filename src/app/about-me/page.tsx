"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

export default function AboutPage() {
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
    <main className="backdrop-blur-lg bg-[#18181b]/90 rounded-2xl shadow-2xl flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 max-w-3xl mx-auto mt-12">
      <h1 className="text-3xl font-extrabold text-gray-100 mb-10 drop-shadow-lg">About Me</h1>
      <div className="flex flex-col md:flex-row items-center gap-10 w-full">
        {about.headshot && (
          <div className="flex-shrink-0 relative aspect-[413/531] w-64 md:w-72 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#23232a] via-[#23232a] to-[#18181b]">
            <Image
              src={urlFor(about.headshot).width(413).height(531).url()}
              alt="Headshot"
              fill
              className="object-cover w-full h-full rounded-2xl border-none"
              priority
            />
            {/* Optional: Soft glow border effect */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-[#6366f1]/40" style={{boxShadow:'0 0 32px 0 #6366f133'}}></div>
          </div>
        )}
        <p className="text-lg text-gray-100 text-center md:text-left leading-relaxed bg-[#23232a]/80 p-6 rounded-2xl shadow-inner w-full">
          {about.bio || "No bio yet. Add your bio in Sanity Studio!"}
        </p>
      </div>
    </main>
  );
}
