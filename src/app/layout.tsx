import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://habien.com"),
  title: {
    default: "Habien - Gamify Your Habits & Grow Your Life",
    template: "%s | Habien",
  },
  description: "Build better habits through gamification. Plant seeds, water them daily, and watch your personal garden flourish as you achieve your goals.",
  keywords: ["habit tracker", "gamified habits", "productivity", "self-improvement", "digital garden", "habit building", "goal tracking"],
  authors: [{ name: "Habien Team" }],
  creator: "Habien",
  publisher: "Habien",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Habien",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Habien - Gamify Your Habits",
    description: "Turn your daily routines into a thriving digital garden. Join thousands of users growing their habits today.",
    url: "https://habien.com",
    siteName: "Habien",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // We might need to generate this or ensure it exists, but usually having the path is good start
        width: 1200,
        height: 630,
        alt: "Habien Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Habien - Gamify Your Habits",
    description: "Build better habits through gamification. Plant seeds, water them daily, and watch your garden grow.",
    creator: "@habien", // Placeholder handle
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
