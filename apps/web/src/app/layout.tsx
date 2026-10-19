import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Inter, Pacifico } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { parseWebOrigin } from "@/lib/env";

import "./globals.css";

// Headlines and prices (tight tracking is set by the type tokens, not here).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Handmade accent: the home eyebrow, the question step label, gift tags. Never body copy.
const script = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

// Placeholder wordmark until the owner supplies the real logo.
const brand = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  // Canonical and Open Graph URLs on the pages are relative; this is their base.
  metadataBase: parseWebOrigin(),
  title: { default: "The Giftpop", template: "%s | The Giftpop" },
  description:
    "Build a gift piece by piece, see it come together, and have it made and sent by hand.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1020" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${script.variable} ${brand.variable}`}
    >
      <body className="bg-canvas text-ink flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="bg-primary text-on-primary sr-only z-50 rounded-md px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="gp-main gp-shell">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
