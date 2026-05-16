"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/timeline", label: "タイムライン" },
  { href: "/videos", label: "動画" },
  { href: "/lives", label: "ライブ" },
  { href: "/radios", label: "ラジオ" },
  { href: "/articles", label: "記事" },
  { href: "/tv", label: "TV" },
  { href: "/topics", label: "トピック" },
  { href: "/combos", label: "コンビ" },
  { href: "/units", label: "ユニット" },
  { href: "/artists", label: "芸人" },
  { href: "/co-stars", label: "共演分析" },
  { href: "/rankings", label: "ランキング" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-brand-border-dark bg-brand-card-dark/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
        <Link
          href="/"
          className="text-[17px] font-bold tracking-wide text-brand-cream transition-colors hover:text-brand-sky-light"
        >
          DonDecorte Lab
        </Link>
        <nav className="hidden md:block">
          <ul className="flex items-center gap-5 text-sm">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "inline-block border-b-[1.5px] border-brand-sky-light pb-[2px] text-brand-sky-light transition-colors duration-150"
                        : "inline-block border-b-[1.5px] border-transparent pb-[2px] text-brand-gold transition-colors duration-150 hover:text-brand-sky-light"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
