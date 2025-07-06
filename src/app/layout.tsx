import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientRoot from "./ClientRoot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "エイタン - 英語探検隊",
  description: "ユーザーフレンドリーでモダンな英語レッスン。会話、自信、実世界のスキルに焦点を当てています。レッスン予約、料金表示、独自のメソッドについて学べます。ネイティブスピーカーによる指導。オンラインと柔軟なスケジューリング。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link
          rel="icon"
          href="/favicon.ico"
          type="image/x-icon"
          sizes="32x32"
        />
        <meta name="theme-color" content="#18181b" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
