import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Track an order" };

export default function TrackPage() {
  return (
    <PlaceholderPage
      eyebrow="Order tracking"
      title="Track an order"
      status="Order tracking is coming soon"
    >
      <p>
        Enter your order number and the phone number or email you used to place it. You will see
        where your gift is and when it moved.
      </p>
    </PlaceholderPage>
  );
}
