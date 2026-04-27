import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContentTabs } from "@/components/features/combo/combo-content-tabs";
import { ComboProfile } from "@/components/features/combo/combo-profile";
import { listAchievementsByTarget } from "@/lib/queries/achievements";
import { getCombo as fetchCombo } from "@/lib/queries/combos";
import { getPerformerContents } from "@/lib/queries/performer-contents";

export const dynamic = "force-dynamic";

const getCombo = cache(fetchCombo);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(combo: {
  name: string;
  kana_name: string | null;
  description: string | null;
}): string {
  const raw = (combo.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${combo.name}${
    combo.kana_name ? `（${combo.kana_name}）` : ""
  }のプロフィール、SNSリンク、出演コンテンツ。`;
  const base = raw || fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const combo = await getCombo(id);
  if (!combo) return {};

  const description = buildDescription(combo);
  const url = `/combos/${combo.id}`;
  const images = combo.image_url ? [{ url: combo.image_url }] : undefined;

  return {
    title: combo.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: combo.name,
      description,
      url,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: combo.name,
      description,
      images: combo.image_url ? [combo.image_url] : undefined,
    },
  };
}

export default async function ComboDetailPage({ params }: Props) {
  const { id } = await params;
  const combo = await getCombo(id);
  if (!combo) notFound();

  const [achievements, contents] = await Promise.all([
    listAchievementsByTarget("comedy_group_id", combo.id),
    getPerformerContents("comedy_group_id", combo.id),
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

      <ComboProfile
        combo={combo}
        members={combo.members}
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
