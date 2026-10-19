import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Partner with us" };

export default function PartnersPage() {
  return (
    <PlaceholderPage
      eyebrow="Partnerships"
      title="Partner with The Giftpop"
      status="Partner forms are coming soon"
    >
      <p>
        Brands will be able to ask for their products to be sold in gifts. People in countries we
        have not launched in will be able to ask us to come to them.
      </p>
    </PlaceholderPage>
  );
}
