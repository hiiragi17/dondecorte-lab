import type { MetadataRoute } from "next";
import { listVideos } from "@/lib/queries/videos";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lives`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  let videoEntries: MetadataRoute.Sitemap = [];
  try {
    const videos = await listVideos();
    videoEntries = videos.map((video) => ({
      url: `${baseUrl}/videos/${video.id}`,
      lastModified: video.updated_at ? new Date(video.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.warn("sitemap: failed to load video entries", error);
    videoEntries = [];
  }

  return [...staticEntries, ...videoEntries];
}
