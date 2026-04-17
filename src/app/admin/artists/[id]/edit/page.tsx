import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistForm } from "@/components/features/artist/artist-form";
import { updateArtist } from "@/lib/actions/artists";
import { getArtist } from "@/lib/queries/artists";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArtistPage({ params }: Props) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) {
    notFound();
  }

  const action = updateArtist.bind(null, id);

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
          {artist.name} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <ArtistForm
          action={action}
          initialValues={artist}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
