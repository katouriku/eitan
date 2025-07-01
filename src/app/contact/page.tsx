"use client";

import React, { useState } from "react";
import "../globals.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setError(result.error || "メッセージの送信に失敗しました。");
      }
    } catch {
      setError("ネットワークエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex flex-col flex-1 min-w-0 w-full min-h-[100vh] pt-20">
        <section className="flex flex-col items-center justify-center w-full px-4">
          <div className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full max-w-lg border-2 border-green-500 flex flex-col items-center gap-6">
            <svg className="w-16 h-16 text-green-400 mb-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-green-400 font-bold text-2xl mb-2">送信完了!</div>
            <div className="text-gray-300 text-center">
              メッセージが正常に送信されました。<br />
              お返事まで少々お待ちください。
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-3 rounded-xl bg-[#3881ff] text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50"
            >
              新しいメッセージを送信
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 w-full min-h-[100vh] pt-20">
      <section className="flex flex-col items-center justify-center w-full px-4">
        <div className="flex flex-col items-center justify-center max-w-2xl min-w-[340px] w-full">
          <span className="font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#3881ff] mb-8 text-center w-full">
            お問い合わせ
          </span>
          
          <form 
            onSubmit={handleSubmit}
            className="bg-[#18181b] p-8 rounded-2xl shadow-xl w-full border-2 border-[#3881ff] flex flex-col gap-6 max-w-lg mx-auto"
          >
            {/* Name and Email side by side on desktop, stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="name" className="block text-gray-200 text-base font-bold text-left mb-2">
                  お名前 <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="例: 山田 太郎"
                  className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="email" className="block text-gray-200 text-base font-bold text-left mb-2">
                  メールアドレス <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="例: your@email.com"
                  className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-gray-200 text-base font-bold text-left mb-2">
                件名 <span className="text-red-400">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="例: レッスンについてのお問い合わせ"
                className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff]"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-gray-200 text-base font-bold text-left mb-2">
                メッセージ <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="お問い合わせ内容をご記入ください..."
                rows={6}
                className="w-full p-3 rounded-lg border border-[#31313a] bg-[#23232a] text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#3881ff] resize-vertical"
              />
            </div>

            {error && (
              <div className="text-red-400 font-bold text-center bg-red-900/20 p-3 rounded-lg border border-red-400/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-[#3881ff] text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3881ff]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "送信中..." : "メッセージを送信"}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-400 max-w-lg">
            <p className="mb-4">
              ご質問やお問い合わせがございましたら、お気軽にご連絡ください。
            </p>
            <p className="text-sm">
              通常、24時間以内にお返事いたします。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
