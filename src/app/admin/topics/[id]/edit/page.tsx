import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoSection } from "@/components/features/memo/memo-section";
import { TopicForm } from "@/components/features/topic/topic-form";
import { updateTopic } from "@/lib/actions/topics";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import { getTopic } from "@/lib/queries/topics";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTopicPage({ params }: Props) {
  const { id } = await params;
  const [topic, artists, combos, units] = await Promise.all([
    getTopic(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!topic) {
    notFound();
  }

  const action = updateTopic.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/topics"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← トピック一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {topic.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <TopicForm
          key={topic.id}
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={topic}
          initialCasts={topic.casts}
          submitLabel="更新する"
        />
      </div>

      <MemoSection targetType="topic" targetId={topic.id} variant="admin" />
    </div>
  );
}
