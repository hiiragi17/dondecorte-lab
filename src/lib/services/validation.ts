const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const TITLE_MAX_LENGTH = 200;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function toNullableString(
  value: FormDataEntryValue | null
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function validateTitle(title: string): string | undefined {
  const trimmed = title.trim();
  if (!trimmed) return "タイトルを入力してください";
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return `${TITLE_MAX_LENGTH}文字以内で入力してください`;
  }
  return undefined;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidEventDate(value: string): boolean {
  const match = EVENT_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
