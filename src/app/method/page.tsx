"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import LoadingAnimation from "../../components/LoadingAnimation";

type MethodData = {
  title: string;
  content: unknown;
  image?: { asset?: { url: string } } | null;
};

export default function MethodPage() {
  const [method, setMethod] = useState<MethodData>({
    title: "",
    content: null,
    image: null,
  });

  useEffect(() => {
    async function fetchMethod() {
      const data = await client.fetch(
        groq`*[_type == "method"][0]{title, content, image}`
      );
      setMethod(data || { title: "", content: null, image: null });
    }
    fetchMethod();
  }, []);

  const isLoading = !method.title && !method.content;

  if (isLoading) {
    return <LoadingAnimation message="教育方法を読み込み中" fullScreen={false} />;
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full px-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3881ff] leading-tight">
              {method.title}
            </h1>
            <div className="prose prose-lg prose-invert max-w-none text-gray-200">
              {method.content && (
                // @ts-expect-error - Sanity content types are dynamic
                <PortableText value={method.content} />
              )}
            </div>
            <Link 
              href="/book-lesson" 
              className="btn-primary inline-block"
            >
              レッスンを予約
            </Link>
          </div>

          {/* Image */}
          {method.image && (
            <div className="relative aspect-[4/5] w-full max-w-sm mx-auto">
              <Image
                src={urlFor(method.image).width(400).height(500).url()}
                alt="Method"
                fill
                className="object-cover rounded-xl shadow-2xl"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
