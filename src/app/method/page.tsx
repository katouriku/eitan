"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import "../globals.css";

export default function MethodPage() {
  const [method, setMethod] = useState<{ title: string; content: any; image?: { asset?: { url: string } } | null }>({
    title: "",
    content: [],
    image: null,
  });

  useEffect(() => {
    async function fetchMethod() {
      const data = await client.fetch(
        groq`*[_type == "method"][0]{title, content, image}`
      );
      setMethod(data || { title: "", content: [], image: null });
    }
    fetchMethod();
  }, []);

  return (
    <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen">
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center w-full min-h-0 min-w-0 max-h-full px-6 py-10 gap-12">
        {method.image && (
          <div className="flex-shrink-0 relative aspect-[413/531] w-64 md:w-80 rounded-2xl overflow-hidden order-1 md:order-none min-h-0 min-w-0">
            <Image
              src={urlFor(method.image).width(413).height(531).url()}
              alt="Method"
              fill
              className="object-cover w-full h-full rounded-2xl border-none"
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        )}
        <div className="flex flex-col items-start justify-center max-w-2xl min-w-[340px] w-full order-2 md:order-none min-h-0 min-w-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3881ff] mb-4 text-left whitespace-nowrap" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>{method.title || "Method"}</h1>
          <div className="text-lg text-gray-100 text-left leading-relaxed mb-6">
            <PortableText value={method.content || []} />
          </div>
          <p className="text-lg sm:text-xl text-gray-200 mb-6 text-left">
            My teaching method is friendly, modern, and focused on real conversation. Lessons are tailored to your goals, with an emphasis on confidence, fluency, and practical English for real life. Every lesson is interactive, supportive, and designed to help you speak naturally.
          </p>
          <Link href="/book-lesson" className="px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b]" style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}>Book a Lesson</Link>
        </div>
      </section>
    </main>
  );
}
