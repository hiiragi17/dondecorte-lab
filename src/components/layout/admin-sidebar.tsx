"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/artists", label: "芸人（Artists）" },
  { href: "/admin/combos", label: "コンビ（Combos）" },
  { href: "/admin/units", label: "ユニット（Units）" },
  { href: "/admin/achievements", label: "受賞歴（Achievements）" },
  { href: "/admin/videos", label: "動画（Videos）" },
  { href: "/admin/lives", label: "ライブ（Lives）" },
  { href: "/admin/radios", label: "ラジオ（Radios）" },
  { href: "/admin/articles", label: "記事（Articles）" },
  { href: "/admin/tv", label: "テレビ（TV）" },
  { href: "/admin/topics", label: "トピック（Topics）" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-brand-border-light bg-brand-card-light md:flex md:flex-col">
      <div className="border-b border-brand-border-light px-5 py-5">
        <Link
          href="/admin"
          className="block text-base font-bold text-brand-brown-dark"
        >
          DonDecorte Lab
        </Link>
        <p className="mt-0.5 text-xs text-brand-brown-light">管理画面</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "block rounded-md bg-brand-sky-pale px-3 py-2 text-sm font-medium text-brand-sky"
                      : "block rounded-md px-3 py-2 text-sm text-brand-brown-dark transition hover:bg-brand-bg-light hover:text-brand-sky"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
