import Link from "next/link";
import { ComboForm } from "@/components/features/combo/combo-form";
import { createCombo } from "@/lib/actions/combos";
import { listArtistSummaries } from "@/lib/queries/artists";

export const dynamic = "force-dynamic";

export default async function NewComboPage() {
  const artists = await listArtistSummaries();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/combos"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← コンビ一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          コンビを新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-4 sm:p-6">
        <ComboForm
          action={createCombo}
          artists={artists}
          submitLabel="作成する"
        />
      </div>
    </div>
  );
}
