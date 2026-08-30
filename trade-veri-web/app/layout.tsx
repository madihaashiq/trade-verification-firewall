import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arcline-autonomous-capital.ming-8832.chatgpt.site"),
  title: "Arcline — Autonomous Capital",
  description: "A clear, premium view of your AI-managed portfolio performance, risk, and trading activity.",
  openGraph: {
    title: "Arcline — Autonomous Capital",
    description: "AI-managed portfolio performance and reporting.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcline — Autonomous Capital",
    description: "AI-managed portfolio performance and reporting.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
