import Link from "next/link";
import { SnsLinks } from "@/components/features/sns/sns-links";
import type { ComboMembershipEntry } from "@/lib/queries/combos";
import type { Achievement } from "@/lib/types/achievement";
import type { Artist } from "@/lib/types/artist";

type Props = {
  artist: Artist;
  memberships: ComboMembershipEntry[];
  achievements: Achievement[];
};

export function ArtistProfile({ artist, memberships, achievements }: Props) {
  return (
    <header className="space-y-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark md:h-40 md:w-40">
          {artist.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={artist.image_url}
              alt={artist.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-brand-muted">No Image</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {artist.debut_year ? (
            <span className="text-xs text-brand-muted">
              デビュー {artist.debut_year}年
            </span>
          ) : null}
          <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
            {artist.name}
          </h1>
          {artist.kana_name ? (
            <p className="text-sm text-brand-gold">{artist.kana_name}</p>
          ) : null}
          {artist.profile ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream md:text-base">
              {artist.profile}
            </p>
          ) : null}
          <div className="pt-1">
            <SnsLinks sns={artist} />
          </div>
        </div>
      </div>

      {memberships.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-cream md:text-base">
            所属コンビ
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {memberships.map(({ combo, role }) => {
              const accent = combo.theme_color ?? undefined;
              return (
                <li key={combo.id}>
                  <Link
                    href={`/combos/${combo.id}`}
                    className="flex gap-3 rounded-lg border border-brand-border-dark bg-brand-card-dark p-3 transition hover:border-brand-sky-light"
                    style={accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : undefined}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-bg-dark">
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
                      {role ? (
                        <p className="mt-1 text-xs text-brand-sky-light">
                          {role}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
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
  );
}
