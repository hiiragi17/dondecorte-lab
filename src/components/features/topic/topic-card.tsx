import Link from "next/link";
import { CastTagList } from "@/components/shared/cast-tag";
import type { TopicWithCasts } from "@/lib/types/topic";
import { formatDate } from "@/lib/utils/date";

export function TopicCard({ topic }: { topic: TopicWithCasts }) {
  const topicDate = formatDate(topic.topic_date);

  return (
    <article className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light">
      <Link href={`/topics/${topic.id}`} className="block group">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {topicDate ? (
            <span className="text-sm font-medium text-brand-gold">
              {topicDate}
            </span>
          ) : null}
          {topic.source ? (
            <span className="inline-flex items-center rounded border border-brand-border-dark bg-brand-bg-dark px-1.5 py-0.5 text-[11px] text-brand-muted">
              {topic.source}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-cream group-hover:text-brand-sky-light">
          {topic.title}
        </p>
      </Link>
      {topic.casts.length > 0 ? (
        <div className="mt-2">
          <CastTagList casts={topic.casts} />
        </div>
      ) : null}
    </article>
  );
}
