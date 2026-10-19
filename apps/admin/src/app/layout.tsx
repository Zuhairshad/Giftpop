import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";

import "./globals.css";

// Body and tables. globals.css maps this variable onto Tailwind's `font-sans`.
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Headings only (`font-heading`, h1 to h3). No script fonts in admin.
const heading = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "The Giftpop Admin", template: "%s | The Giftpop Admin" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${heading.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
