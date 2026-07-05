import Link from "next/link";
import { VideoDeleteButton } from "@/components/features/video/video-delete-button";
import { deleteVideo } from "@/lib/actions/videos";
import { listVideos } from "@/lib/queries/videos";
import type { VideoReviewStatus } from "@/lib/types/video";
import { formatDateCompact } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const REVIEW_STATUS_BADGE: Record<
  VideoReviewStatus,
  { label: string; className: string }
> = {
  approved: {
    label: "承認済み",
    className:
      "inline-flex rounded-full bg-brand-bg-light px-2 py-0.5 text-xs text-brand-brown-light",
  },
  pending: {
    label: "承認待ち",
    className:
      "inline-flex rounded-full bg-brand-gold/20 px-2 py-0.5 text-xs font-medium text-brand-brown-dark",
  },
  rejected: {
    label: "却下",
    className:
      "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700",
  },
};

export default async function AdminVideosPage() {
  const videos = await listVideos({ includeUnapproved: true });
  const pendingCount = videos.filter(
    (video) => video.review_status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-brown-dark">動画</h1>
          <p className="mt-1 text-sm text-brand-brown-light">
            YouTube動画と出演者を管理します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/videos/review"
            className="rounded-md border border-brand-border-light px-4 py-2 text-sm text-brand-brown-dark transition hover:bg-brand-bg-light"
          >
            レビュー
            {pendingCount > 0 ? `（承認待ち ${pendingCount}件）` : ""}
          </Link>
          <Link
            href="/admin/videos/new"
            className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark"
          >
            新規作成
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border-light bg-brand-card-light">
        {videos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
            まだ動画が登録されていません。
          </p>
        ) : (
          <table className="min-w-full divide-y divide-brand-border-light text-sm">
            <thead className="bg-brand-bg-light text-xs text-brand-brown-light">
              <tr>
                <th className="px-4 py-2 text-left font-medium">タイトル</th>
                <th className="px-4 py-2 text-left font-medium">状態</th>
                <th className="px-4 py-2 text-left font-medium">公開日</th>
                <th className="px-4 py-2 text-left font-medium">動画ID</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-brand-bg-light">
                  <td className="max-w-xs truncate px-4 py-2 font-medium text-brand-brown-dark">
                    {video.title}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={REVIEW_STATUS_BADGE[video.review_status].className}
                    >
                      {REVIEW_STATUS_BADGE[video.review_status].label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-brand-brown-light">
                    {formatDateCompact(video.published_at)}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-brand-brown-light">
                    {video.youtube_video_id ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/videos/${video.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={deleteVideo}>
                        <input type="hidden" name="id" value={video.id} />
                        <VideoDeleteButton title={video.title} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
