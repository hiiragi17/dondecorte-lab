import type { Metadata } from "next";
import Link from "next/link";
import { listArtists } from "@/lib/queries/artists";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "芸人",
  description: "ドンデコルテさん関連の芸人一覧。",
  alternates: { canonical: "/artists" },
  openGraph: {
    title: "芸人",
    description: "ドンデコルテさん関連の芸人一覧。",
    url: "/artists",
  },
};

export default async function ArtistsPage() {
  const artists = await listArtists();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          芸人
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん関連の芸人一覧。
        </p>
      </header>

      {artists.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだ芸人が登録されていません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <li key={artist.id}>
              <Link
                href={`/artists/${artist.id}`}
                className="flex h-full gap-3 rounded-lg border border-brand-border-dark bg-brand-card-dark p-3 transition hover:border-brand-sky-light"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-bg-dark">
                  {artist.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={artist.image_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-brand-muted">
                      No Image
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-cream">
                    {artist.name}
                  </p>
                  {artist.kana_name ? (
                    <p className="truncate text-xs text-brand-muted">
                      {artist.kana_name}
                    </p>
                  ) : null}
                  {artist.debut_year ? (
                    <p className="mt-1 text-xs text-brand-gold">
                      デビュー {artist.debut_year}年
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
