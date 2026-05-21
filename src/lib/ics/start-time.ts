// lives.start_time は schema 上 timestamptz。フォーム入力経路によっては
// "HH:MM:SS" 形式の文字列が入っている場合もあるため両方を許容する。
export function normalizeStartTimeForIcs(value: string | null): string | null {
  if (!value) return null;
  const hhmm = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmm) {
    return `${hhmm[1]}:${hhmm[2]}:${hhmm[3] ?? "00"}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const hh = parts.find((p) => p.type === "hour")?.value;
  const mm = parts.find((p) => p.type === "minute")?.value;
  const ss = parts.find((p) => p.type === "second")?.value;
  if (!hh || !mm || !ss) return null;
  return `${hh}:${mm}:${ss}`;
}
