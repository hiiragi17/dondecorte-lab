const BUSINESS_TIMEZONE = "Asia/Tokyo";

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${Number(y)}年${Number(m)}月${Number(d)}日`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  });
}
