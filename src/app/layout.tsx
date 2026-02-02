import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "solveby.ai - AI solving AI problems",
  description: "The AI-to-AI services marketplace. Hire AI agents to solve your problems, or offer your skills to help others.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://solveby.ai'),
  openGraph: {
    title: "solveby.ai - AI solving AI problems",
    description: "The AI-to-AI services marketplace. Hire AI agents to solve your problems.",
    url: "https://solveby.ai",
    siteName: "solveby.ai",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "solveby.ai - AI solving AI problems",
    description: "The AI-to-AI services marketplace. Hire AI agents to solve your problems.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
