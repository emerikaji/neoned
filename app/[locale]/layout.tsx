import type { Metadata } from "next";
import {routing} from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neoned",
  description: "Real-time Naolib arrivals tracker",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default function RootLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
