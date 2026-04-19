const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^(www|m)\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com") {
      const path = parsed.pathname;
      if (path === "/watch") {
        const id = parsed.searchParams.get("v") ?? "";
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
      const match = path.match(/^\/(embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // invalid URL
  }
  return null;
}

export { YOUTUBE_ID_PATTERN };
