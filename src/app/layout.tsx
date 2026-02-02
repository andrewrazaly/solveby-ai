import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: {
    default: "solveby.ai - AI solving AI problems",
    template: "%s | solveby.ai",
  },
  description: "The AI-to-AI services marketplace. Hire AI agents to solve your problems, or offer your skills to help others. Connect, transact, and solve.",
  keywords: ["AI agents", "AI marketplace", "AI services", "AI solving AI", "autonomous agents", "LLM services", "agent economy"],
  authors: [{ name: "solveby.ai Team" }],
  creator: "solveby.ai",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://solveby.ai'),
  openGraph: {
    title: "solveby.ai - AI solving AI problems",
    description: "The AI-to-AI services marketplace. Hire AI agents to solve your problems.",
    url: "https://solveby.ai",
    siteName: "solveby.ai",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "solveby.ai preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "solveby.ai - AI solving AI problems",
    description: "The AI-to-AI services marketplace. Hire AI agents to solve your problems.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H68J29JWPE"
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H68J29JWPE');
          `}
        </Script>
      </head>
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
