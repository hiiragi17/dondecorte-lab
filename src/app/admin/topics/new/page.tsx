import Link from "next/link";
import { TopicForm } from "@/components/features/topic/topic-form";
import { createTopic } from "@/lib/actions/topics";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export default async function NewTopicPage() {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

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
          トピックを新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <TopicForm
          action={createTopic}
          artists={artists}
          combos={combos}
          units={units}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
