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

export default function PricingPage() {
  const [pricing, setPricing] = useState({
    title: "",
    price: "",
    unit: "",
    details: [],
    image: null,
  });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    async function fetchPricing() {
      const data = await client.fetch(
        groq`*[_type == "pricing"][0]{title, price, unit, details, image}`
      );
      setPricing({
        title: data?.title || "",
        price: data?.price || "",
        unit: data?.unit || "",
        details: data?.details || [],
        image: data?.image || null,
      });
      if (!data?.image) setImageLoaded(true);
    }
    fetchPricing();
  }, []);

  useEffect(() => {
    if (!pricing.image || imageLoaded) setImageLoaded(true);
  }, [pricing.image, imageLoaded]);

  return (
    <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen">
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center w-full min-h-0 min-w-0 max-h-full px-6 py-10 gap-12">
        {/* Image to the left on desktop, above on mobile */}
        {pricing.image && getImageUrl(pricing.image) && (
          <div className="flex-shrink-0 relative aspect-square w-64 md:w-80 rounded-2xl overflow-hidden order-1 md:order-none min-h-0 min-w-0">
            <Image
              src={getImageUrl(pricing.image) as string}
              alt="Pricing"
              fill
              className="object-cover w-full h-full rounded-2xl border-none"
              priority
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        )}
        <div className="flex flex-col items-start justify-center max-w-2xl min-w-[340px] w-full order-2 md:order-none min-h-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3881ff] mb-4 text-left whitespace-nowrap" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>
            {pricing.title}
          </h1>
          <ul className="text-lg sm:text-xl text-gray-200 mb-6 text-left list-disc pl-6">
            {pricing.details && pricing.details.length > 0 &&
              pricing.details.map((detail, idx) => (
                <li className="mb-2" key={idx}>{detail}</li>
              ))}
          </ul>
          {(pricing.price || pricing.unit) && (
            <div className="flex flex-row items-center gap-2 text-xl text-gray-200 mb-4 whitespace-nowrap">
              {pricing.price && <span className="font-bold text-[#3881ff] whitespace-nowrap">{pricing.price}</span>}
              {pricing.unit && <span className="ml-2 text-base text-gray-400 whitespace-nowrap">{pricing.unit}</span>}
            </div>
          )}
          <Link
            href="/book-lesson"
            className="px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b]"
            style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}
          >
            Book a Lesson
          </Link>
        </div>
      </section>
    </main>
  );
}
