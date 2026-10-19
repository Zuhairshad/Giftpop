type GiftIllustrationProps = { className?: string };

/** Decorative gift box. Colours come from the design tokens so it follows light and dark. */
export function GiftIllustration({ className }: GiftIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <circle cx="40" cy="48" r="9" fill="var(--gp-butter)" />
      <circle cx="168" cy="36" r="6" fill="var(--gp-mint)" />
      <circle cx="176" cy="112" r="8" fill="var(--gp-sky)" />
      <circle cx="22" cy="120" r="5" fill="var(--gp-lilac)" />
      <rect x="40" y="92" width="120" height="86" rx="14" fill="var(--gp-pink)" />
      <rect x="32" y="72" width="136" height="32" rx="12" fill="var(--gp-pink-strong)" />
      <rect x="92" y="72" width="16" height="106" fill="var(--gp-butter)" />
      <path d="M100 72 C 78 36, 52 44, 62 62 C 68 74, 92 74, 100 72 Z" fill="var(--gp-butter)" />
      <path
        d="M100 72 C 122 36, 148 44, 138 62 C 132 74, 108 74, 100 72 Z"
        fill="var(--gp-butter)"
      />
      <circle cx="100" cy="72" r="8" fill="var(--gp-pink-strong)" />
    </svg>
  );
}
