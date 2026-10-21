"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { shareLabel } from "./gifts-model";
import { giftSharePayload, shareGift, shareMessage } from "./share-gift";

import { Button } from "@/components/ui";
import { shareUrl } from "@/features/share/links";

/**
 * "Share" for one gift: the device's share sheet when there is one, otherwise the link is copied.
 * The link is the gift's `/g/<shareId>` page, which carries its name and description for previews.
 */
export function ShareGiftButton({
  title,
  description,
  shareId,
}: {
  title: string;
  description: string;
  shareId: string;
}): ReactElement {
  const [status, setStatus] = useState("");

  async function onShare(): Promise<void> {
    const url = shareUrl(window.location.origin, shareId);
    const share =
      typeof navigator.share === "function"
        ? (data: Parameters<typeof navigator.share>[0]) => navigator.share(data)
        : undefined;
    const outcome = await shareGift(
      { share, clipboard: navigator.clipboard },
      giftSharePayload({ title, description }, url),
    );
    setStatus(shareMessage(outcome, url));
  }

  return (
    <div className="min-w-0">
      <Button variant="ghost" size="md" block aria-label={shareLabel(title)} onClick={onShare}>
        Share
      </Button>
      <p
        role="status"
        aria-live="polite"
        className="text-muted mt-1 text-sm wrap-anywhere empty:hidden"
      >
        {status}
      </p>
    </div>
  );
}
