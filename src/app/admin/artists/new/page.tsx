import Link from "next/link";
import { ArtistForm } from "@/components/features/artist/artist-form";
import { createArtist } from "@/lib/actions/artists";

export default function NewArtistPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/artists"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 芸人一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          芸人を新規作成
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <ArtistForm action={createArtist} submitLabel="作成する" />
      </div>
    </div>
  );
}
