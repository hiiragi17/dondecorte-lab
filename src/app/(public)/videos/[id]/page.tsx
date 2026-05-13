import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MemoSection } from "@/components/features/memo/memo-section";
import { RelatedContents } from "@/components/features/related/related-contents";
import { VideoPlayer } from "@/components/features/video/video-player";
import { getRelatedContents } from "@/lib/queries/related-contents";
import { getVideo as fetchVideo } from "@/lib/queries/videos";
import type { CastEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const getVideo = cache(fetchVideo);

type Props = {
  params: Promise<{ id: string }>;
};

const RELATED_LIMIT = 6;
const DESCRIPTION_MAX_LENGTH = 160;

function buildDescription(video: {
  description: string | null;
  casts: CastEntry[];
  title: string;
}): string {
  const performerNames = video.casts.map((c) => c.name).join("、");
  const performerText = performerNames ? `出演: ${performerNames}。` : "";
  const raw = (video.description ?? "").replace(/\s+/g, " ").trim();
  const fallback = `${performerText}ドンデコルテさん関連動画「${video.title}」の詳細ページ。`;
  const base = raw ? `${performerText}${raw}` : fallback;
  if (base.length <= DESCRIPTION_MAX_LENGTH) return base;
  return `${base.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return {};

  const description = buildDescription(video);
  const url = `/videos/${video.id}`;
  const images = video.thumbnail_url ? [{ url: video.thumbnail_url }] : undefined;

  return {
    title: video.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "video.other",
      title: video.title,
      description,
      url,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: video.title,
      description,
      images: video.thumbnail_url ? [video.thumbnail_url] : undefined,
    },
  };
}

function castHref(cast: CastEntry): string {
  switch (cast.type) {
    case "artist":
      return `/artists/${cast.id}`;
    case "comedy_group":
      return `/combos/${cast.id}`;
    case "unit":
      return `/units/${cast.id}`;
  }
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const related = await getRelatedContents(
    video.casts,
    { type: "video", id: video.id },
    RELATED_LIMIT
  );
  const published = formatDate(video.published_at);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
      <div className="mb-4">
        <Link
          href="/videos"
          className="text-xs text-brand-muted transition hover:text-brand-sky-light"
        >
          ← 動画一覧
        </Link>
      </div>

      {video.youtube_video_id ? (
        <VideoPlayer
          youtubeVideoId={video.youtube_video_id}
          title={video.title}
        />
      ) : video.youtube_url ? (
        <div className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          この動画はYouTubeでの直接再生に対応していません。
          <a
            href={video.youtube_url}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-1 text-brand-sky-light underline"
          >
            YouTubeで視聴する
          </a>
        </div>
      ) : null}

      <h1 className="mt-5 text-xl font-bold text-brand-cream md:text-2xl">
        {video.title}
      </h1>
      {published ? (
        <p className="mt-2 text-xs text-brand-muted md:text-sm">{published}</p>
      ) : null}

      {video.casts.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {video.casts.map((cast) => (
            <Link
              key={`${cast.type}-${cast.id}`}
              href={castHref(cast)}
              className="inline-flex items-center rounded-full border border-brand-border-dark bg-brand-card-dark px-3 py-1 text-xs text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
            >
              {cast.name}
            </Link>
          ))}
        </div>
      ) : null}

      {video.description ? (
        <section className="mt-6 rounded-lg border border-brand-border-dark bg-brand-card-dark p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
            {video.description}
          </p>
        </section>
      ) : null}

      <MemoSection targetType="video" targetId={video.id} />

      <RelatedContents contents={related} />
    </div>
  );
}
