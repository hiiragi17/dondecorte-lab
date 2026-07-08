// FANY チケット（ticket.fany.lol）への取得層（#97 / #42）。
//
// 方針: fany.lol は robots で明示的な禁止がなく、規約にスクレイピング明示禁止もない。
// ただし「運営妨害」条項・業務妨害リスクを避けるため "行儀のよいクローラ" として実装する。
//   - User-Agent にプロジェクト名 + 連絡先を必ず入れる（問題視された時に連絡が来る＝ブロックされにくい）
//   - ETag / If-None-Match でキャッシュし、変化がなければ 304 で早期リターン
//   - 429 / 5xx は指数バックオフでリトライ、それ以外の異常ステータスは即 throw
//   - 対象は公開の事実データのみ。全件を毎回舐めず、新規イベントの詳細だけ追加取得する（sync 側）

export const BASE = "https://ticket.fany.lol";
export const TARGET = "ドンデコルテ";

// 連絡先 / 公開 URL は本番で環境変数から差し込む（未設定時はプレースホルダのまま送る）。
const CONTACT = process.env.FANY_BOT_CONTACT ?? "contact@example.com";
const SITE_URL = process.env.FANY_BOT_URL ?? "https://example.com/about";

export const USER_AGENT = `DonDecorteLabBot/1.0 (+${SITE_URL}; personal fan project; contact=${CONTACT})`;

export type FetchResult = {
  status: number;
  html: string;
  etag?: string;
};

// 行儀のよい取得: 429 / 5xx は指数バックオフ、304 は空 html で早期リターン。
export async function fetchPolite(
  url: string,
  { retries = 3, etag }: { retries?: number; etag?: string } = {}
): Promise<FetchResult> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja",
        ...(etag ? { "If-None-Match": etag } : {}),
      },
    });
    if (res.status === 304) return { status: 304, html: "", etag };
    if (res.status === 200) {
      return {
        status: 200,
        html: await res.text(),
        etag: res.headers.get("etag") ?? undefined,
      };
    }
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2 ** i * 1000)); // 指数バックオフ
      continue;
    }
    throw new Error(`Unexpected status ${res.status} for ${url}`);
  }
  throw new Error(`Gave up after retries: ${url}`);
}

// 検索 URL。
// TODO[PARAM]: 先行受付前 / 受付中フィルタ・ページング（もっと見る）のパラメータを実機で確認して付与。
export function buildSearchUrl(keyword: string = TARGET): string {
  return `${BASE}/search/event?keywords=${encodeURIComponent(keyword)}&search_type=search_string`;
}
