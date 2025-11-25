import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';
import Footer from "@/components/Footer";
import Script from "next/script";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tabiristan",
  description: "Rüyalarınızın gizli dilini çözün. Yapay zeka destekli, en kapsamlı rüya ansiklopedisi.",
  verification: {
    other: {
      "p:domain_verify": "893996b9a3192200080f47fcd49a0c83", // Sadece tırnak içindeki kodu
    },
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
      
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* G- Kodunu buraya yazıyorsun nnn*/}
        <GoogleAnalytics gaId="G-8EKSSYR1WK" />

        {/* 2. AdSense (MANUEL YÖNTEM - KESİN ÇALIŞIR) */}
        {/* ca-pub kodunu linkin sonundaki X'lerin yerine yaz */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4462865736634031"
          crossOrigin="anonymous"></Script>



        {children}

        <Footer />
      </body>
    </html>
  );
}
