import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/videos", label: "動画" },
  { href: "/lives", label: "ライブ" },
  { href: "/radios", label: "ラジオ" },
  { href: "/articles", label: "記事" },
  { href: "/tv", label: "TV" },
  { href: "/topics", label: "トピック" },
  { href: "/combos", label: "コンビ" },
  { href: "/artists", label: "芸人" },
];

export async function PublicHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-brand-border-dark bg-brand-bg-dark/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="text-base font-bold tracking-wide text-brand-cream transition hover:text-brand-sky-light md:text-lg"
        >
          DonDecorte Lab
        </Link>
        <nav className="hidden md:block">
          <ul className="flex items-center gap-5 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-brand-gold transition hover:text-brand-sky-light"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {user ? (
          <Link
            href="/admin"
            className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-xs font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
          >
            管理画面
          </Link>
        ) : null}
      </div>
    </header>
  );
}
