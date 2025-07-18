"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import LoadingAnimation from "../../components/LoadingAnimation";

export default function AboutMePage() {
  const [about, setAbout] = useState<{ 
    bio: PortableTextBlock[]; 
    headshot?: { asset?: { url: string } } | null 
  }>({
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

  const isLoading = !about.bio.length && !about.headshot;

  if (isLoading) {
    return <LoadingAnimation message="プロフィールを読み込み中" fullScreen={false} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-[var(--card)]/50 border border-[var(--border)] rounded-2xl p-8 shadow-2xl backdrop-blur-sm hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Headshot */}
          {about.headshot && (
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none order-1 lg:order-1">
              <Image
                src={urlFor(about.headshot).width(400).height(500).url()}
                alt="About me"
                fill
                className="object-cover rounded-xl shadow-2xl"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Bio Content */}
          <div className="space-y-6 order-2 lg:order-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3881ff] leading-tight">
              私について
            </h1>
            <div className="prose prose-lg max-w-none text-[var(--foreground)]">
              <PortableText value={about.bio} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
