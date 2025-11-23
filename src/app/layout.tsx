import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from '../components/GA'; 

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

        {children}
      </body>
    </html>
  );
}
