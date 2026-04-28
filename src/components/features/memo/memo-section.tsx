import { listMemos } from "@/lib/queries/memos";
import type { ContentType } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";
import { MemoEditor } from "./memo-editor";

type Props = {
  targetType: ContentType;
  targetId: string;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDate(value) ?? value;
  }
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export async function MemoSection({ targetType, targetId }: Props) {
  const memos = await listMemos(targetType, targetId);

  const items = memos.map((memo) => ({
    id: memo.id,
    content: memo.content,
    timestamp: formatTimestamp(memo.updated_at ?? memo.created_at),
  }));

  return (
    <section
      className="rounded-lg border border-brand-border-light bg-brand-card-light p-6"
      aria-label="メモ"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-brown-dark md:text-lg">
          メモ
        </h2>
        <span className="text-xs text-brand-brown-light">{items.length}件</span>
      </div>
      <MemoEditor targetType={targetType} targetId={targetId} memos={items} />
    </section>
  );
}
