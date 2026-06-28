"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  { href: "/admin/cms", label: "CM（CMs）" },
  { href: "/admin/magazines", label: "雑誌（Magazines）" },
  { href: "/admin/topics", label: "トピック（Topics）" },
  { href: "/admin/tags", label: "タグ（Tags）" },
  { href: "/admin/notifications", label: "通知（Notifications）" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
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
  );
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
        <NavList pathname={pathname} />
      </nav>
    </aside>
  );
}

export function AdminMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mql = window.matchMedia("(min-width: 768px)");
    const onMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    mql.addEventListener("change", onMediaChange);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onMediaChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleOpen = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      return;
    }
    setOpen(true);
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="メニューを開く"
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-brand-border-light text-brand-brown-dark transition hover:bg-brand-bg-light"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {open ? (
        <div
          id="admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="管理メニュー"
          className="fixed inset-0 z-50"
        >
          <div
            className="absolute inset-0 bg-brand-brown-dark/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-brand-card-light shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-border-light px-5 py-4">
              <div>
                <Link
                  href="/admin"
                  className="block text-base font-bold text-brand-brown-dark"
                >
                  DonDecorte Lab
                </Link>
                <p className="mt-0.5 text-xs text-brand-brown-light">
                  管理画面
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="メニューを閉じる"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-brown-light transition hover:bg-brand-bg-light hover:text-brand-brown-dark"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
