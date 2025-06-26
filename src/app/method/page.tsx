"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";

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
    <main className="backdrop-blur-lg bg-[#18181b]/90 rounded-2xl shadow-2xl flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 max-w-3xl mx-auto mt-12">
      <h1 className="text-3xl font-extrabold text-gray-100 mb-10 drop-shadow-lg">{method.title || "Method"}</h1>
      <div className="flex flex-col md:flex-row items-center gap-10 w-full">
        {method.image && (
          <div className="flex-shrink-0 relative aspect-[413/531] w-64 md:w-72 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#23232a] via-[#23232a] to-[#18181b]">
            <Image
              src={urlFor(method.image).width(413).height(531).url()}
              alt="Method"
              fill
              className="object-cover w-full h-full rounded-2xl border-none"
              priority
            />
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-[#6366f1]/40" style={{boxShadow:'0 0 32px 0 #6366f133'}}></div>
          </div>
        )}
        <div className="text-lg text-gray-100 text-center md:text-left leading-relaxed bg-[#23232a]/80 p-6 rounded-2xl shadow-inner w-full">
          <PortableText value={method.content || []} />
        </div>
      </div>
    </main>
  );
}
