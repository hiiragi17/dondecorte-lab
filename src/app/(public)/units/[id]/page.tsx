import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContentTabs } from "@/components/features/combo/combo-content-tabs";
import { listAchievementsByTarget } from "@/lib/queries/achievements";
import { getPerformerContents } from "@/lib/queries/performer-contents";
import { getUnit as fetchUnit } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

const getUnit = cache(fetchUnit);

type Props = {
  params: Promise<{ id: string }>;
};

const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(unit: {
  name: string;
  description: string | null;
}): string {
  const raw = (unit.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${unit.name}の構成メンバーと出演コンテンツ。`;
  const base = raw || fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const unit = await getUnit(id);
  if (!unit) return {};

  const description = buildDescription(unit);
  const url = `/units/${unit.id}`;

  return {
    title: unit.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: unit.name,
      description,
      url,
    },
  };
}

export default async function UnitDetailPage({ params }: Props) {
  const { id } = await params;
  const unit = await getUnit(id);
  if (!unit) notFound();

  const [achievements, contents] = await Promise.all([
    listAchievementsByTarget("unit_id", unit.id),
    getPerformerContents("unit_id", unit.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/units"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← ユニット一覧
        </Link>
      </div>

      <header className="space-y-4">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          {unit.name}
        </h1>
        {unit.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream md:text-base">
            {unit.description}
          </p>
        ) : null}

        {unit.members.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-brand-cream md:text-base">
              構成メンバー
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {unit.members.map((m) => (
                <li key={`${m.type}-${m.id}`}>
                  <Link
                    href={
                      m.type === "comedy_group"
                        ? `/combos/${m.id}`
                        : `/artists/${m.id}`
                    }
                    className="block rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light"
                  >
                    <p className="text-sm font-semibold text-brand-cream">
                      {m.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs text-brand-muted">
                      <span>{m.type === "comedy_group" ? "コンビ" : "芸人"}</span>
                      {m.kana_name ? <span>{m.kana_name}</span> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {achievements.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-brand-cream md:text-base">
              受賞歴
            </h2>
            <ul className="space-y-2">
              {achievements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-xs font-medium text-brand-gold">
                      {a.year}
                    </span>
                    <span className="text-sm text-brand-cream">{a.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-sky-light">{a.result}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </header>

      <div className="mt-10">
        <ContentTabs
          videos={contents.videos}
          lives={contents.lives}
          radios={contents.radios}
          tvShows={contents.tvShows}
          articles={contents.articles}
          cms={contents.cms}
          magazines={contents.magazines}
          topics={contents.topics}
        />
      </div>
    </div>
  );
}
