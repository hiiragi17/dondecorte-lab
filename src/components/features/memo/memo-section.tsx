import { listMemos } from "@/lib/queries/memos";
import { createClient } from "@/lib/supabase/server";
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
  const [memos, supabase] = await Promise.all([
    listMemos(targetType, targetId),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canEdit = Boolean(user);

  const items = memos.map((memo) => ({
    id: memo.id,
    content: memo.content,
    timestamp: formatTimestamp(memo.updated_at ?? memo.created_at),
  }));

  return (
    <section
      className="mt-10 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4"
      aria-label="メモ"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-cream md:text-lg">
          メモ
        </h2>
        <span className="text-xs text-brand-muted">{items.length}件</span>
      </div>

      {canEdit ? (
        <MemoEditor targetType={targetType} targetId={targetId} memos={items} />
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-muted">まだメモはありません。</p>
      ) : (
        <ul className="space-y-3">
          {items.map((memo) => (
            <li
              key={memo.id}
              className="rounded-md border border-brand-border-dark bg-brand-bg-dark/60 p-3"
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
                {memo.content}
              </p>
              <p className="mt-2 text-[11px] text-brand-muted">
                {memo.timestamp}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
