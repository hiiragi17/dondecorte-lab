const DEFAULT_SITE_URL = "http://localhost:3000";

function normalize(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    const normalized = normalize(explicit);
    if (normalized) return normalized;
  }

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    const normalized = normalize(vercel);
    if (normalized) return normalized;
  }

  return DEFAULT_SITE_URL;
}
