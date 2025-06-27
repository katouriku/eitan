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
  title: "エイタン",
  description:
    "User-friendly, modern English tutoring with a focus on conversation, confidence, and real-world skills. Book lessons, view pricing, and learn about our unique method. Taught by a native English speaker. Online and flexible scheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#18181b]`}
        style={{
          minHeight: "100%",
          height: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
