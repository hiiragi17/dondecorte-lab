import type { ContentType } from "@/lib/types";

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  video: "動画",
  live: "ライブ",
  radio: "ラジオ",
  article: "記事",
  tv_show: "TV",
  topic: "トピック",
  cm: "CM",
  magazine: "雑誌",
};

export function ContentTypeBadge({ type }: { type: ContentType }) {
  return (
    <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-card-dark px-2 py-0.5 text-[11px] font-medium text-brand-gold">
      {CONTENT_TYPE_LABEL[type]}
    </span>
  );
}

export function getContentTypeLabel(type: ContentType): string {
  return CONTENT_TYPE_LABEL[type];
}
