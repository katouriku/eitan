"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { PortableText } from "@portabletext/react";
import LoadingAnimation from "../../components/LoadingAnimation";

type MethodData = {
  _id: string;
  title: string;
  content: unknown;
  image?: { asset?: { url: string } } | null;
};

export default function MethodPage() {
  const [methods, setMethods] = useState<MethodData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMethods() {
      try {
        const data = await client.fetch(
          groq`*[_type == "method"] | order(_createdAt asc){_id, title, content, image}`
        );
        setMethods(data || []);
      } catch (error) {
        console.error('Error fetching methods:', error);
        setMethods([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMethods();
  }, []);

  if (loading) {
    return <LoadingAnimation message="教育方法を読み込み中" fullScreen={false} />;
  }

  if (methods.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--muted-foreground)] mb-4">
            教育方法が見つかりません
          </h1>
          <p className="text-[var(--muted-foreground)]">
            現在、教育方法の情報が登録されていません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-8">
          {methods.map((method) => (
            <div 
              key={method._id}
              className="bg-[var(--card)]/50 border border-[var(--border)] rounded-2xl p-6 shadow-2xl backdrop-blur-sm hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300 w-full max-w-md lg:min-w-[25vw] lg:max-w-[30vw] lg:flex-1"
            >
              <div className="flex flex-col gap-6 items-center text-center">
                {/* Content */}
                <div className="space-y-4 flex-1">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3881ff] leading-tight">
                    {method.title}
                  </h2>
                  <div className="prose prose-sm max-w-none text-[var(--foreground)] text-left">
                    {method.content && (
                      // @ts-expect-error - Sanity content types are dynamic
                      <PortableText value={method.content} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
