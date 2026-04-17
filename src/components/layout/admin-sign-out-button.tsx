"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";

export function AdminSignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form action={() => startTransition(() => signOut())}>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-brand-border-light bg-brand-cream px-3 py-1.5 text-xs font-medium text-brand-brown-dark transition hover:bg-brand-bg-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "ログアウト中..." : "ログアウト"}
      </button>
    </form>
  );
}
