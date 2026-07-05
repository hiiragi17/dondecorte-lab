import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { VideoDeleteButton } from "@/components/features/video/video-delete-button";
import { approveVideo, deleteVideo, rejectVideo } from "@/lib/actions/videos";
import { listVideosForReview } from "@/lib/queries/videos";
import type { VideoWithCasts } from "@/lib/types/video";
import { formatDateCompact } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

// next.config.ts の images.remotePatterns で許可済みの img.youtube.com のみ使う
function thumbnailSrc(video: VideoWithCasts): string | null {
  if (!video.youtube_video_id) return null;
  return `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;
}

function ReviewVideoRow({
  video,
  actions,
}: {
  video: VideoWithCasts;
  actions: ReactNode;
}) {
  const src = thumbnailSrc(video);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      {src ? (
        <Image
          src={src}
          alt=""
          width={160}
          height={90}
          className="h-[90px] w-40 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-[90px] w-40 shrink-0 items-center justify-center rounded-md bg-brand-bg-light text-xs text-brand-brown-light">
          サムネなし
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-brand-brown-dark">{video.title}</p>
        <p className="text-xs text-brand-brown-light">
          公開日: {formatDateCompact(video.published_at)}
        </p>
        {video.casts.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {video.casts.map((cast) => (
              <li
                key={`${cast.type}-${cast.id}`}
                className="inline-flex items-center rounded-full border border-brand-border-light bg-brand-bg-light px-2 py-0.5 text-xs text-brand-brown-dark"
              >
                {cast.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-brand-brown-light">出演者未設定</p>
        )}
        {video.youtube_url ? (
          <a
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-brand-sky transition hover:underline"
          >
            YouTubeで確認 ↗
          </a>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </li>
  );
}

export default async function ReviewVideosPage() {
  const { pending, rejected } = await listVideosForReview();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/videos"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 動画一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          自動取得動画のレビュー
        </h1>
        <p className="mt-1 text-sm text-brand-brown-light">
          YouTube自動取得で追加された動画を確認し、承認すると公開側に表示されます。
          出演者を修正したい場合は「編集」からタグ付けしてください。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-brand-brown-dark">
          承認待ち（{pending.length}件）
        </h2>
        <div className="rounded-lg border border-brand-border-light bg-brand-card-light">
          {pending.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
              承認待ちの動画はありません。
            </p>
          ) : (
            <ul className="divide-y divide-brand-border-light">
              {pending.map((video) => (
                <ReviewVideoRow
                  key={video.id}
                  video={video}
                  actions={
                    <>
                      <Link
                        href={`/admin/videos/${video.id}/edit`}
                        className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                      >
                        編集
                      </Link>
                      <form action={approveVideo}>
                        <input type="hidden" name="id" value={video.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-brand-sky px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-sky-dark"
                        >
                          承認
                        </button>
                      </form>
                      <form action={rejectVideo}>
                        <input type="hidden" name="id" value={video.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-brand-gold px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-cream"
                        >
                          却下
                        </button>
                      </form>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-brand-brown-dark">
          却下済み（{rejected.length}件）
        </h2>
        <p className="text-xs text-brand-brown-light">
          却下した動画は公開されませんが、再取り込み防止のため残しています。削除すると次回同期で再び承認待ちに入ります。
        </p>
        <div className="rounded-lg border border-brand-border-light bg-brand-card-light">
          {rejected.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-brown-light">
              却下済みの動画はありません。
            </p>
          ) : (
            <ul className="divide-y divide-brand-border-light">
              {rejected.map((video) => (
                <ReviewVideoRow
                  key={video.id}
                  video={video}
                  actions={
                    <>
                      <form action={approveVideo}>
                        <input type="hidden" name="id" value={video.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                        >
                          承認する
                        </button>
                      </form>
                      <form action={deleteVideo}>
                        <input type="hidden" name="id" value={video.id} />
                        <VideoDeleteButton title={video.title} />
                      </form>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
