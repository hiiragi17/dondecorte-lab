export type SnsInput = {
  x_url?: string | null;
  instagram_url?: string | null;
  note_url?: string | null;
  youtube_channel_url?: string | null;
  standfm_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
};

type SnsLink = {
  key: keyof SnsInput;
  label: string;
};

const LINKS: SnsLink[] = [
  { key: "x_url", label: "X" },
  { key: "instagram_url", label: "Instagram" },
  { key: "youtube_channel_url", label: "YouTube" },
  { key: "tiktok_url", label: "TikTok" },
  { key: "note_url", label: "note" },
  { key: "standfm_url", label: "stand.fm" },
  { key: "website_url", label: "Web" },
];

function normalizeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function SnsLinks({ sns }: { sns: SnsInput }) {
  const items = LINKS.flatMap((link) => {
    const href = normalizeExternalUrl(sns[link.key]);
    return href ? [{ ...link, href }] : [];
  });

  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((link) => (
        <li key={link.key}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-full border border-brand-border-dark bg-brand-card-dark px-3 py-1 text-xs font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            {link.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
