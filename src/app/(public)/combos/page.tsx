import type { Metadata } from "next";
import Link from "next/link";
import { listCombos } from "@/lib/queries/combos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "コンビ",
  description: "ドンデコルテさん関連のコンビ一覧。",
  alternates: { canonical: "/combos" },
  openGraph: {
    title: "コンビ",
    description: "ドンデコルテさん関連のコンビ一覧。",
    url: "/combos",
  },
};

export default async function CombosPage() {
  const combos = await listCombos();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          コンビ
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん関連のコンビ一覧。
        </p>
      </header>

      {combos.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだコンビが登録されていません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => {
            const accent = combo.theme_color ?? undefined;
            return (
              <li key={combo.id}>
                <Link
                  href={`/combos/${combo.id}`}
                  className="flex h-full gap-3 rounded-lg border border-brand-border-dark bg-brand-card-dark p-3 transition hover:border-brand-sky-light"
                  style={
                    accent
                      ? { borderLeftColor: accent, borderLeftWidth: 4 }
                      : undefined
                  }
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-bg-dark">
                    {combo.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={combo.image_url}
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
                      {combo.name}
                    </p>
                    {combo.kana_name ? (
                      <p className="truncate text-xs text-brand-muted">
                        {combo.kana_name}
                      </p>
                    ) : null}
                    {combo.formed_year ? (
                      <p className="mt-1 text-xs text-brand-gold">
                        結成 {combo.formed_year}年
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
