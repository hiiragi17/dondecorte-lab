import type { Metadata } from "next";
import Link from "next/link";
import { listUnits } from "@/lib/queries/units";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ユニット",
  description: "ドンデコルテさんが参加するユニット一覧。",
  alternates: { canonical: "/units" },
  openGraph: {
    title: "ユニット",
    description: "ドンデコルテさんが参加するユニット一覧。",
    url: "/units",
  },
};

export default async function UnitsPage() {
  const units = await listUnits();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          ユニット
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさんが参加するユニット一覧。
        </p>
      </header>

      {units.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだユニットが登録されていません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <li key={unit.id}>
              <Link
                href={`/units/${unit.id}`}
                className="block h-full rounded-lg border border-brand-border-dark bg-brand-card-dark p-4 transition hover:border-brand-sky-light"
              >
                <p className="text-sm font-semibold text-brand-cream">
                  {unit.name}
                </p>
                {unit.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-brand-muted">
                    {unit.description}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
