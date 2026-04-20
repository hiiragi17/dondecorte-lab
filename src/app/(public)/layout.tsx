import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/header";
import { PublicFooter } from "@/components/layout/footer";
import { PublicBottomNav } from "@/components/layout/bottom-nav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-brand-bg-dark text-brand-cream">
      <PublicHeader />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">{children}</main>
      <PublicFooter />
      <PublicBottomNav />
    </div>
  );
}
