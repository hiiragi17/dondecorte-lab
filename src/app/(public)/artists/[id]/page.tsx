import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArtistProfile } from "@/components/features/artist/artist-profile";
import { ContentTabs } from "@/components/features/combo/combo-content-tabs";
import { listAchievementsByTarget } from "@/lib/queries/achievements";
import { getArtist as fetchArtist } from "@/lib/queries/artists";
import { listCombosForArtist } from "@/lib/queries/combos";
import { getPerformerContents } from "@/lib/queries/performer-contents";

export const dynamic = "force-dynamic";

const getArtist = cache(fetchArtist);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(artist: {
  name: string;
  kana_name: string | null;
  profile: string | null;
}): string {
  const raw = (artist.profile ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${artist.name}${
    artist.kana_name ? `（${artist.kana_name}）` : ""
  }のプロフィール、SNSリンク、所属コンビ、出演コンテンツ。`;
  const base = raw || fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return {};

  const description = buildDescription(artist);
  const url = `/artists/${artist.id}`;
  const images = artist.image_url ? [{ url: artist.image_url }] : undefined;

  return {
    title: artist.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: artist.name,
      description,
      url,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: artist.name,
      description,
      images: artist.image_url ? [artist.image_url] : undefined,
    },
  };
}

export default async function ArtistDetailPage({ params }: Props) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  const [memberships, achievements, contents] = await Promise.all([
    listCombosForArtist(artist.id),
    listAchievementsByTarget("artist_id", artist.id),
    getPerformerContents("artist_id", artist.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← トップに戻る
        </Link>
      </div>

      <ArtistProfile
        artist={artist}
        memberships={memberships}
        achievements={achievements}
      />

      <div className="mt-10">
        <ContentTabs
          videos={contents.videos}
          lives={contents.lives}
          radios={contents.radios}
          tvShows={contents.tvShows}
          articles={contents.articles}
        />
      </div>
    </div>
  );
}
