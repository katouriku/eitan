"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";

// Helper to safely get image URL
function getImageUrl(image: any) {
  try {
    if (!image) return null;
    return urlFor(image).width(400).height(400).url();
  } catch {
    return null;
  }
}

export default function PricingPage() {
  const [pricing, setPricing] = useState({
    title: "Hourly Session",
    price: "¥4,000",
    unit: "per 1 hour session",
    details: [
      "Personalized lesson plan",
      "Flexible scheduling",
      "Online or in-person options",
      "All materials provided",
    ],
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    async function fetchPricing() {
      const data = await client.fetch(
        groq`*[_type == "pricing"][0]{title, price, unit, details, image}`
      );
      setPricing({
        title: data?.title || "Hourly Session",
        price: data?.price || "¥4,000",
        unit: data?.unit || "per 1 hour session",
        details: data?.details || [
          "Personalized lesson plan",
          "Flexible scheduling",
          "Online or in-person options",
          "All materials provided",
        ],
        image: data?.image || null,
      });
      if (!data?.image) setLoading(false);
    }
    fetchPricing();
  }, []);

  useEffect(() => {
    if (!pricing.image || imageLoaded) setLoading(false);
  }, [pricing.image, imageLoaded]);

  return (
    <main className="backdrop-blur-lg bg-[#18181b]/90 rounded-2xl shadow-2xl flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 max-w-3xl mx-auto mt-12 data-[theme=light]:text-gray-900">
      <h1 className="text-3xl font-extrabold text-gray-100 data-[theme=light]:text-gray-900 mb-8 drop-shadow-lg">
        Pricing
      </h1>
      {(loading) ? (
        <div className="w-full flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse w-full h-56 bg-[#23232a] data-[theme=light]:bg-[#e0e7ff] rounded-2xl" />
        </div>
      ) : (
        <div className="relative w-full flex flex-col items-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#23232a] via-[#18181b] to-[#23232a] data-[theme=light]:from-[#e0e7ff] data-[theme=light]:via-[#f7f7fa] data-[theme=light]:to-[#e5e7eb] blur-sm z-0" />
          <div className="relative bg-[#18181b] data-[theme=light]:bg-white p-8 rounded-2xl shadow-2xl w-full border-2 border-[#6366f1] data-[theme=light]:border-[#6366f1]/30 z-10 flex flex-col md:flex-row items-center gap-8">
            {getImageUrl(pricing.image) && (
              <Image
                src={getImageUrl(pricing.image)!}
                alt="Pricing visual"
                width={224}
                height={224}
                className="object-cover w-56 h-56 md:w-56 md:h-56 rounded-xl"
                onLoad={() => setImageLoaded(true)}
                onLoadingComplete={() => setImageLoaded(true)}
                priority
              />
            )}
            <div className="flex-1 w-full flex flex-col items-center md:items-start">
              <h2 className="text-xl font-bold text-gray-100 data-[theme=light]:text-gray-900 mb-4">
                {pricing.title}
              </h2>
              <p className="text-4xl font-extrabold text-white data-[theme=light]:text-[#6366f1] mb-2 drop-shadow">
                {pricing.price}
              </p>
              <p className="text-gray-200 data-[theme=light]:text-gray-700">{pricing.unit}</p>
              <ul className="mt-6 text-gray-100 data-[theme=light]:text-gray-900 text-left list-disc list-inside space-y-2">
                {pricing.details.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <Link
                href="/book-lesson"
                className="mt-8 inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white data-[theme=light]:text-white font-extrabold text-lg shadow-lg hover:scale-105 hover:from-[#818cf8] hover:to-[#6366f1] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#6366f1]/50 animate-bounce"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
