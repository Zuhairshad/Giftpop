import type { Asset } from "@giftpop/contracts";

interface ThumbProps {
  image?: Asset | undefined;
  /** Fallback swatch colour when there is no image. */
  color?: string;
  label: string;
}

/** A small square preview for a list row. */
export function Thumb({ image, color = "#cccccc", label }: ThumbProps) {
  return (
    <span className="bg-muted/50 inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
      {image ? (
        <img src={image.url} alt={label} className="size-full object-contain" />
      ) : (
        <span
          role="img"
          aria-label={`${label} (no image yet)`}
          className="size-5 rounded-full border"
          style={{ backgroundColor: color }}
        />
      )}
    </span>
  );
}
