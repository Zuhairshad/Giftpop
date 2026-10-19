interface CardPreviewProps {
  recipientName: string;
  message: string;
}

/** A simple greeting card that shows what the customer has typed so far. */
export function CardPreview({ recipientName, message }: CardPreviewProps) {
  const name = recipientName.trim();
  const text = message.trim();
  return (
    <figure
      aria-label="Card preview"
      className="from-pink-soft to-butter/60 border-border shadow-pop rounded-card relative mx-auto w-full max-w-sm -rotate-1 border bg-gradient-to-br p-5 motion-reduce:rotate-0"
    >
      <figcaption className="text-pink-strong text-xs font-extrabold tracking-widest uppercase">
        Card preview
      </figcaption>
      <div className="bg-surface/80 mt-3 min-h-40 rounded-soft p-4">
        <p className="font-display text-xl font-bold wrap-anywhere">
          {name ? `Dear ${name},` : <span className="text-muted">Dear friend,</span>}
        </p>
        <p className="mt-2 wrap-anywhere whitespace-pre-wrap">
          {text || <span className="text-muted">Your message will appear here.</span>}
        </p>
        <p className="font-display text-pink-strong mt-4 text-right text-lg font-bold">
          With love, The Giftpop
        </p>
      </div>
    </figure>
  );
}
