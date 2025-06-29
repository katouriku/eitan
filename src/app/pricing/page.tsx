"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import "../globals.css";

// Helper to safely get image URL
function getImageUrl(image: object) {
  try {
    if (!image) return null;
    return urlFor(image as object).width(400).height(400).url();
  } catch {
    return null;
  }
}

type Pricing = {
  title: string;
  price: string;
  unit: string;
  details: string[];
  image: { asset?: { url?: string } } | null;
};

export default function PricingPage() {
  const [pricings, setPricings] = useState<Pricing[]>([]);

  const isLoading = !pricings || pricings.length === 0;

  useEffect(() => {
    async function fetchPricing() {
      const data = await client.fetch(
        groq`*[_type == "pricing"]{title, price, unit, details, image}`
      );
      setPricings(data || []);
    }
    fetchPricing();
  }, []);

  if (isLoading) {
    return (
      <main className="flex flex-col flex-1 min-w-0 w-full min-h-[100vh] pt-20">
        <div className="text-2xl text-gray-400">ロード中...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 min-w-0 w-full md:pt-20 md:pb-24">
      <section className="flex flex-col md:flex-row flex-nowrap justify-center items-stretch gap-12 w-full px-6 py-6">
        {pricings.map((pricing, idx) => (
          <div key={idx} className="flex flex-col md:flex-row items-center md:items-stretch justify-center max-w-3xl w-full md:min-w-180 bg-[#23272f] rounded-2xl shadow-lg p-6 min-h-0 min-w-0">
            {pricing.image && getImageUrl(pricing.image) && (
              <div className="flex-shrink-0 relative aspect-square w-full md:w-1/2 max-w-xs md:max-w-sm rounded-2xl overflow-hidden mb-4 md:mb-0 md:mr-8">
                <Image
                  src={getImageUrl(pricing.image) as string}
                  alt="Pricing"
                  fill
                  className="object-cover w-full h-full rounded-2xl border-none"
                  priority
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              </div>
            )}
            <div className="flex flex-col items-start justify-center w-full md:w-1/2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3881ff] mb-4 text-left whitespace-nowrap" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>
                {pricing.title}
              </h1>
              <ul className="text-base sm:text-lg text-gray-200 mb-6 text-left list-disc pl-6">
                {pricing.details && pricing.details.length > 0 &&
                  pricing.details.map((detail: string, i: number) => (
                    <li className="mb-2" key={i}>{detail}</li>
                  ))}
              </ul>
              {(pricing.price || pricing.unit) && (
                <div className="flex flex-row items-center gap-2 text-lg text-gray-200 mb-4 whitespace-nowrap">
                  {pricing.price && <span className="font-bold text-[#3881ff] whitespace-nowrap">{pricing.price}</span>}
                  {pricing.unit && <span className="ml-2 text-base text-gray-400 whitespace-nowrap">{pricing.unit}</span>}
                </div>
              )}
              <Link
                href={(() => {
                  const title = pricing.title.toLowerCase().replace(/\s/g, "");
                  if (title.includes("対面レッスン")) return "/book-lesson?lessonType=in-person";
                  if (title.includes("ゲームレッスン")) return "/book-lesson?lessonType=online";
                  return "/book-lesson";
                })()}
                className="px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b] mb-4"
                style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}>
                レッスンを予約
              </Link>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
