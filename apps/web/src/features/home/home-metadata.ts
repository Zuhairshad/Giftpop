import type { CountryCode } from "@giftpop/contracts";
import type { Metadata } from "next";

import { homeMeta } from "./home-copy";

/** Title, description, canonical and Open Graph for `/` (no input) and `/<cc>`. */
export function homeMetadata(input: { code?: CountryCode; name?: string } = {}): Metadata {
  const { title, description, path } = homeMeta(input);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "The Giftpop",
      title: `${title} | The Giftpop`,
      description,
      url: path,
    },
  };
}
