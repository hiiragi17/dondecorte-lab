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
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "ja",
          ...(etag ? { "If-None-Match": etag } : {}),
        },
        // fetch は既定でタイムアウトしない。ticket.fany.lol がハングすると cron 関数が
        // プラットフォームに kill されるまでブロックし続けるため、明示的に打ち切る。
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      // タイムアウト / ネットワークエラーはバックオフして再試行し、最終回で再送出する。
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 2 ** i * 1000));
        continue;
      }
      throw err;
    }
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

// 検索フィルタ（search_type=form。パラメータは devtools 実機で確認済み）。
//   ngk_beforeReception=on 先行抽選・受付前 / ngk_accepting=on 先行抽選・受付中
//   ngk_beforesale=on      先着・発売前     / ngk_sale=on       先着・発売中
//   from,to 公演日レンジ / prefectures(0=全国) / genre(0=全ジャンル)
export interface SearchFilter {
  beforeReception?: boolean; // 先行抽選 受付前
  accepting?: boolean; // 先行抽選 受付中
  beforeSale?: boolean; // 先着 発売前
  sale?: boolean; // 先着 発売中
  from?: string; // "YYYY-MM-DD" など（実フォーマットは実機で確認）
  to?: string;
  prefectures?: number; // 0 = 全国
  genre?: number; // 0 = 全ジャンル
}

export function buildSearchUrl(
  keyword: string = TARGET,
  f: SearchFilter = {}
): string {
  const p = new URLSearchParams();
  p.set("keywords", keyword);
  p.set("from", f.from ?? "");
  p.set("to", f.to ?? "");
  if (f.beforeReception) p.set("ngk_beforeReception", "on");
  if (f.accepting) p.set("ngk_accepting", "on");
  if (f.beforeSale) p.set("ngk_beforesale", "on");
  if (f.sale) p.set("ngk_sale", "on");
  p.set("prefectures", String(f.prefectures ?? 0));
  p.set("genre", String(f.genre ?? 0));
  // フィルタ無しは軽い search_string、有りは form。
  p.set(
    "search_type",
    f.beforeReception || f.accepting || f.beforeSale || f.sale
      ? "form"
      : "search_string"
  );
  return `${BASE}/search/event?${p.toString()}`;
}

// #97: 先行抽選の受付前 + 受付中だけを狙う URL。普段は 0 件 = 空振り（= 軽い）。
export const presaleWatchUrl = (keyword: string = TARGET) =>
  buildSearchUrl(keyword, { beforeReception: true, accepting: true });

// #42: 発売前後も含めて「今動きのある公演」を広めに拾う URL（新規発見 + 突発販売用）。
export const discoveryUrl = (keyword: string = TARGET) =>
  buildSearchUrl(keyword, {
    beforeReception: true,
    accepting: true,
    beforeSale: true,
    sale: true,
  });
