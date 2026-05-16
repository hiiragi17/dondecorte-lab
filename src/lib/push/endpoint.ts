// Web Push の購読 endpoint は外部 URL をそのまま受け取り、broadcastPush 時に
// サーバから直接 POST する。未検証の endpoint を許すと、攻撃者が内部ホストや
// クラウドメタデータ等を endpoint として登録し、サーバに任意ホストへ
// リクエストさせる SSRF になりうる。
// そのため主要ブラウザのプッシュサービスのホストのみを許可する。
const ALLOWED_PUSH_HOSTS = new Set([
  "fcm.googleapis.com", // Chrome / Edge(Chromium) — FCM
  "updates.push.services.mozilla.com", // Firefox — Mozilla autopush
  "web.push.apple.com", // Safari / iOS — Apple Push
]);

// サブドメインを持つプロバイダはホスト末尾一致で許可する。
const ALLOWED_PUSH_HOST_SUFFIXES = [
  ".notify.windows.com", // Edge(レガシー) / WNS
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (ALLOWED_PUSH_HOSTS.has(host)) return true;
  return ALLOWED_PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}
