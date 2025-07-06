"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import LoadingAnimation from "../../components/LoadingAnimation";

type Pricing = {
  title: string;
  price: string;
  unit: string;
  details: string[];
  image: { asset?: { url?: string } } | null;
};

export default function PricingPage() {
  const [pricings, setPricings] = useState<Pricing[]>([]);

  useEffect(() => {
    async function fetchPricing() {
      const data = await client.fetch(
        groq`*[_type == "pricing"]{title, price, unit, details, image}`
      );
      setPricings(data || []);
    }
    fetchPricing();
  }, []);

  const isLoading = pricings.length === 0;

  if (isLoading) {
    return <LoadingAnimation message="料金情報を読み込み中" fullScreen={false} />;
  }

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3881ff] leading-tight">
          レッスンの種類
        </h1>
      </div>
      
      <div className={`grid gap-6 lg:gap-8 justify-items-center ${
        pricings.length === 1 
          ? 'max-w-lg mx-auto' 
          : pricings.length === 2 
          ? 'md:grid-cols-2 max-w-5xl mx-auto justify-center' 
          : 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto justify-center'
      }`}>
        {pricings.map((pricing, index) => (
          <Link
            key={index}
            href={`/book-lesson?lessonType=${pricing.title.toLowerCase().includes('オンライン') || pricing.title.toLowerCase().includes('online') ? 'online' : 'in-person'}`}
            className="bg-[var(--card)]/50 border border-[var(--border)] rounded-xl p-8 lg:p-10 hover:border-[#3881ff]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#3881ff]/10 hover:scale-[1.02] cursor-pointer group w-full max-w-sm"
          >
            {pricing.image && (
              <div className="relative aspect-square w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden">
                <Image
                  src={urlFor(pricing.image).width(96).height(96).url()}
                  alt={pricing.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            
            <div className="text-center space-y-4">
              <h2 className="text-xl lg:text-2xl font-bold text-[var(--foreground)] group-hover:text-[#3881ff] transition-colors">
                {pricing.title}
              </h2>
              
              <div className="text-2xl lg:text-3xl font-bold text-[#3881ff]">
                {pricing.price}
                <span className="text-sm text-[var(--muted-foreground)] font-normal"><br />
                  {pricing.unit}
                </span>
              </div>
              
              {pricing.details && pricing.details.length > 0 && (
                <ul className="space-y-2 text-left text-[var(--muted-foreground)]">
                  {pricing.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#3881ff] mt-1">•</span>
                      <span className="text-sm lg:text-base">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-[#3881ff] to-[#5a9eff] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                このプランで予約
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
