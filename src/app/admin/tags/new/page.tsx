import Link from "next/link";
import { TagForm } from "@/components/features/tag/tag-form";
import { createTag } from "@/lib/actions/tags";

export const dynamic = "force-dynamic";

export default function NewTagPage() {
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
          タグを新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <TagForm action={createTag} submitLabel="作成する" />
      </div>
    </div>
  );
}
