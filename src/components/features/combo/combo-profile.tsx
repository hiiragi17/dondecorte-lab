import Link from "next/link";
import { SnsLinks } from "@/components/features/sns/sns-links";
import type { Achievement } from "@/lib/types/achievement";
import type { Combo, ComboMemberWithArtist } from "@/lib/types/combo";

const GROUP_TYPE_LABEL: Record<Combo["group_type"], string> = {
  combo: "コンビ",
  trio: "トリオ",
  quartet: "カルテット",
  other: "その他",
};

type Props = {
  combo: Combo;
  members: ComboMemberWithArtist[];
  achievements: Achievement[];
};

export function ComboProfile({ combo, members, achievements }: Props) {
  const accent = combo.theme_color ?? undefined;
  const sortedMembers = [...members].sort((a, b) => {
    const ka = a.artist.kana_name ?? "";
    const kb = b.artist.kana_name ?? "";
    const cmp = ka.localeCompare(kb);
    return cmp !== 0 ? cmp : a.artist.name.localeCompare(b.artist.name);
  });

  return (
    <header>
      <div className="mb-7 flex flex-col gap-5 border-b border-brand-border-dark pb-7 md:flex-row md:items-start">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark md:h-40 md:w-40">
          {combo.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={combo.image_url}
              alt={combo.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-brand-muted">No Image</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border border-brand-border-dark bg-brand-card-dark px-2 py-0.5 text-[11px] text-brand-sky-light"
              style={accent ? { borderColor: accent, color: accent } : undefined}
            >
              {GROUP_TYPE_LABEL[combo.group_type]}
            </span>
            {combo.formed_year ? (
              <span className="text-xs text-brand-muted">
                結成 {combo.formed_year}年
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
            {combo.name}
          </h1>
          {combo.kana_name ? (
            <p className="text-sm text-brand-gold">{combo.kana_name}</p>
          ) : null}
          {combo.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream md:text-base">
              {combo.description}
            </p>
          ) : null}
          <div className="pt-1">
            <SnsLinks sns={combo} />
          </div>
        </div>
      </div>

      {sortedMembers.length > 0 ? (
        <section className="mb-7 border-b border-brand-border-dark pb-7">
          <h2 className="mb-3 text-sm font-semibold text-brand-cream md:text-base">
            メンバー
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sortedMembers.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/artists/${m.artist.id}`}
                  className="block rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light"
                >
                  <p className="text-sm font-semibold text-brand-cream">
                    {m.artist.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs text-brand-muted">
                    {m.artist.kana_name ? (
                      <span>{m.artist.kana_name}</span>
                    ) : null}
                    {m.role ? (
                      <span className="text-brand-sky-light">{m.role}</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {achievements.length > 0 ? (
        <section className="mb-7 border-b border-brand-border-dark pb-7 last:mb-0 last:border-b-0 last:pb-0">
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
  );
}
