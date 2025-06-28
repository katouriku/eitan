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
  const [method, setMethod] = useState<{ title: string; content: unknown; image?: { asset?: { url: string } } | null }>({
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

  // Show loading state until Sanity content is ready
  if (!method || (!method.title && (!Array.isArray(method.content) || method.content.length === 0) && !method.image)) {
    return (
      <main className="flex flex-col flex-1 min-h-0 min-w-0 w-full h-screen max-h-screen items-center justify-center">
        <div className="text-2xl text-gray-400">ロード中...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 w-full">
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center w-full min-h-0 min-w-0 max-h-full px-6 py-10 gap-12">
        {method.image && (
          <div className="flex-shrink-0 relative aspect-[413/531] w-64 md:w-80 rounded-2xl overflow-hidden order-1 md:order-none min-h-0 min-w-0">
            <Image
              src={typeof method.image === 'object' && method.image ? urlFor(method.image).width(413).height(531).url() : ''}
              alt="Method"
              fill
              className="object-cover w-full h-full rounded-2xl border-none"
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        )}
        <div className="flex flex-col items-start justify-center md:min-w-200 w-full order-2 md:order-none min-h-0 min-w-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3881ff] mb-4 text-left whitespace-nowrap" style={{textShadow:'0 2px 12px rgba(56,129,255,0.10)'}}>{method.title || "Method"}</h1>
          <div className="text-lg text-gray-100 text-left leading-relaxed mb-6">
            <PortableText value={Array.isArray(method.content) ? method.content : []} />
          </div>
          <Link href="/book-lesson" className="px-8 py-3 min-w-100 md:min-w-0 rounded-full text-center font-bold text-lg uppercase tracking-wide bg-[#3881ff] text-white shadow-md border border-[#3881ff] hover:scale-105 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-[#18181b]" style={{textShadow:'0 1px 6px rgba(56,129,255,0.10)'}}>レッスンを予約</Link>
        </div>
      </section>
    </main>
  );
}
