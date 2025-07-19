"use client";

import React, { useState } from "react";

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
      <div className="bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-2xl shadow-xl w-full flex flex-col items-center gap-6 max-w-lg mx-auto min-h-0 min-w-0 max-h-[90vh] justify-center hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
        <svg className="w-16 h-16 text-green-400 mb-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <div className="text-green-400 font-bold text-2xl mb-2">送信完了!</div>
        <div className="text-[var(--muted-foreground)] text-center">
          お問い合わせいただきありがとうございます。<br />
          24時間以内にご返信いたします。
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md mt-4"
        >
          新しいメッセージを送る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3881ff] leading-tight">
          お問い合わせ
        </h1>
        <p className="text-lg text-[var(--muted-foreground)]">
          ご質問やご相談がございましたら、お気軽にお問い合わせください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--card)]/50 border border-[var(--border)] p-8 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-xl hover:shadow-[#3881ff]/10 transition-all duration-300">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              お名前 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
              placeholder="山田太郎"
              style={{
                WebkitBoxShadow: '0 0 0 1000px var(--input) inset',
                WebkitTextFillColor: 'var(--foreground)',
                backgroundColor: 'var(--input) !important'
              }}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              メールアドレス <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
              placeholder="your@email.com"
              style={{
                WebkitBoxShadow: '0 0 0 1000px var(--input) inset',
                WebkitTextFillColor: 'var(--foreground)',
                backgroundColor: 'var(--input) !important'
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            件名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
            placeholder="お問い合わせの件名"
            style={{
              WebkitBoxShadow: '0 0 0 1000px var(--input) inset',
              WebkitTextFillColor: 'var(--foreground)',
              backgroundColor: 'var(--input) !important'
            }}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            メッセージ <span className="text-red-400">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300 resize-vertical"
            placeholder="お問い合わせ内容をご記入ください..."
            style={{
              WebkitBoxShadow: '0 0 0 1000px var(--input) inset',
              WebkitTextFillColor: 'var(--foreground)',
              backgroundColor: 'var(--input) !important'
            }}
          />
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-900/50 border border-red-700 text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 text-lg bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {loading ? "送信中..." : "メッセージを送信"}
        </button>
      </form>
    </div>
  );
}
