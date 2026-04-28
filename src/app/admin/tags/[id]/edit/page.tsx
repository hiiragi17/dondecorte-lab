import Link from "next/link";
import { notFound } from "next/navigation";
import { TagForm } from "@/components/features/tag/tag-form";
import { updateTag } from "@/lib/actions/tags";
import { getTag } from "@/lib/queries/tags";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTagPage({ params }: Props) {
  const { id } = await params;
  const tag = await getTag(id);

  if (!tag) {
    notFound();
  }

  const action = updateTag.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tags"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← タグ一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          タグを編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <TagForm action={action} initialValues={tag} submitLabel="更新する" />
      </div>
    </div>
  );
}
