"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

const PRIMARY_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/lives", label: "Lives" },
  { href: "/artists", label: "Artists" },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/timeline", label: "タイムライン" },
  { href: "/combos", label: "コンビ" },
  { href: "/units", label: "ユニット" },
  { href: "/radios", label: "ラジオ" },
  { href: "/articles", label: "記事" },
  { href: "/tv", label: "TV" },
  { href: "/topics", label: "トピック" },
  { href: "/rankings", label: "ランキング" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  const moreActive = MORE_ITEMS.some((item) => isActive(pathname, item.href));

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      {moreOpen ? (
        <div
          id="public-bottom-nav-more"
          className="border-t border-brand-border-dark bg-brand-card-dark px-4 py-3 shadow-lg"
        >
          <ul className="grid grid-cols-3 gap-2">
            {MORE_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      active
                        ? "block rounded-md bg-brand-sky-pale/10 px-3 py-2 text-center text-xs font-medium text-brand-sky-light"
                        : "block rounded-md px-3 py-2 text-center text-xs text-brand-gold transition hover:text-brand-sky-light"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <nav className="border-t border-brand-border-dark bg-brand-bg-dark/95 backdrop-blur">
        <ul className="mx-auto grid max-w-6xl grid-cols-5">
          {PRIMARY_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "flex h-14 items-center justify-center text-xs font-semibold text-brand-sky-light"
                      : "flex h-14 items-center justify-center text-xs text-brand-gold transition hover:text-brand-sky-light"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls="public-bottom-nav-more"
              className={
                moreActive || moreOpen
                  ? "flex h-14 w-full items-center justify-center text-xs font-semibold text-brand-sky-light"
                  : "flex h-14 w-full items-center justify-center text-xs text-brand-gold transition hover:text-brand-sky-light"
              }
            >
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
