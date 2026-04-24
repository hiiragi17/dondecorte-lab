import { LiveList } from "@/components/features/live/live-list";
import { listLivesWithCasts } from "@/lib/queries/lives";

export const dynamic = "force-dynamic";

export default async function LivesPage() {
  const lives = await listLivesWithCasts();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          ライブ
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん関連のライブ情報一覧。
        </p>
      </header>

      <LiveList lives={lives} />
    </div>
  );
}
