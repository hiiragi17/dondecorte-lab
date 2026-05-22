# PWA 化 + Web Push 通知 + Fany ライブ情報連携 実装プラン

## ゴール

1. アプリを PWA 化してスマホのホーム画面にインストール可能にする
2. Web Push でスマホにプッシュ通知を送信できる基盤を作る
3. Fany（よしもとお笑いポータル）からドンデコルテのライブ情報を定期取得し、**新しいライブ / 先行抽選が告知されたタイミング**で発見通知する

> **通知アーキテクチャ整理（#115）**: 通知を **発見**（Web Push）と **リマインド**（Google カレンダー委譲, #114）に分離した。本プランの Web Push は **発見専用**。抽選開始 / 締切 / 当日朝の **リマインド push は廃止**し #114 へ移管。

既存資産との関係:

- `lives.is_notified`（migration 001）と issue #42（ライブ通知 / メール or LINE Notify）が既に想定されている。本プランは #42 の通知チャネルを **Web Push** に置き換える / 追加する形で進める。
- Vercel デプロイ前提（issue #25）、Vercel Cron は issue #39 で導入予定。本プランはその Cron 基盤に乗る。

---

## 全体アーキテクチャ

```text
┌────────────┐   1. fetch HTML/JSON    ┌────────────┐
│ Vercel Cron│ ──────────────────────► │   Fany     │
│ (daily)    │                         │ (live一覧) │
└─────┬──────┘                         └────────────┘
      │ 2. diff & upsert
      ▼
┌──────────────────────────────────────────────────┐
│ Supabase: lives / live_presales / push_subscriptions │
└─────┬────────────────────────────────────────────┘
      │ 3. 通知対象を抽出
      ▼
┌────────────┐  4. web-push (VAPID)   ┌────────────┐
│ Notify API │ ──────────────────────► │ User Phone │
│ (Route)    │                         │ (PWA / SW) │
└────────────┘                         └────────────┘
```

---

## フェーズ 1: PWA 基盤

スマホで Web Push を受け取るには、**iOS 16.4+ では「ホーム画面に追加した PWA」状態が必須**。なので先に PWA 化する。

### やること

- `public/manifest.webmanifest` を作成
  - `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color: "#1A120B"`, `background_color: "#1A120B"`
  - `icons[]`: 192/512 PNG（既存 `src/app/icon.svg` から PNG を書き出し）
- `src/app/layout.tsx` の `metadata` に `manifest` と `appleWebApp` を追加
  - iOS の場合 `apple-touch-icon` が別途必要
- Service Worker
  - **Serwist (`@serwist/next`)** を採用（Next.js 16 / App Router 公式推奨パス）
  - `src/app/sw.ts` を作成し、`@serwist/next` の `withSerwist` を `next.config.ts` でラップ
  - キャッシュ戦略は最小限（基本 NetworkFirst）— このアプリは動的データ中心なのでオフライン目的ではなく **プッシュ受信のため** に SW を置く
- インストール促進 UI（任意・後回し可）
  - `beforeinstallprompt` をフックして、公開トップに「ホームに追加」ボタンを出す

### 確認

- Lighthouse の PWA 監査が通る
- iPhone Safari で「ホーム画面に追加」 → スタンドアロン起動できる

---

## フェーズ 2: Web Push 基盤

### DB

新規テーブル `push_subscriptions` を追加（migration 005）:

```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
-- RLS:
--   insert は anon 可（誰でも自分の端末を購読登録できる）
--   select / delete は service_role のみ（endpoint / p256dh / auth は機微情報のため anon に読ませない）
--   通知送信時の subscription 一覧取得はサーバ側（Server Action / Route Handler）から service_role キーで実行
```

> 自分専用アプリなので user_id への紐付けは省略。複数端末（iPhone / 自宅 PC）で複数 subscription が並ぶ想定。

### 環境変数

- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`（`mailto:...`）
- ローカル生成: `npx web-push generate-vapid-keys`

### サーバ側

- `web-push` パッケージを追加（Vercel Node ランタイムで動かす）
- `src/lib/push/sender.ts` — `sendPush(subscription, payload)` ヘルパ
  - 404/410 が返ったら `push_subscriptions` から削除（古い endpoint 自動 GC）
- API Route:
  - `POST /api/push/subscribe` — `PushSubscription` を受け取り upsert
  - `POST /api/push/unsubscribe` — endpoint 指定で delete
- Server Action: 管理画面からテスト送信できる `sendTestPush()`

### クライアント側

- `src/components/features/push/push-toggle.tsx`
  - ボタン押下で `Notification.requestPermission()` → `serviceWorker.ready.pushManager.subscribe({applicationServerKey})` → `/api/push/subscribe`
  - 状態は `localStorage` ではなく `pushManager.getSubscription()` を真値とする
- 設置場所: 公開トップ or 設定モーダル（フッタ付近）。ログイン不要で誰でも購読可
- Service Worker (`src/app/sw.ts`) に `push` イベントハンドラ追加
  - `event.data.json()` の `{ title, body, url, tag }` を `showNotification`
  - `notificationclick` で `clients.openWindow(url)`

### 確認

- 自分の iPhone（PWA インストール済み）で購読 → 管理画面からテスト送信 → 通知が届く

---

## フェーズ 3: Fany からのライブ情報取得

> ⚠️ 著作権ルール（CLAUDE.md）と Fany の利用規約・robots.txt を必ず確認。許諾範囲が不明なら、本人/事務所公式ポストや TIGET / Peatix など別ソースに切り替える方針も検討。**実装着手前にスクレイピング可否を確認する**。

### 調査タスク（コード書く前）

- [ ] Fany の robots.txt と ToS を確認
- [ ] ドンデコルテ出演ライブ一覧の URL とレスポンス形式を確認（JSON エンドポイントがあるか、HTML のみか）
- [ ] チケット販売情報（先行抽選/一般販売の開始日時）が同じページに載っているか確認

### DB スキーマ拡張

既存 `lives` だけでは「先行抽選の開始/終了時刻」を持てないので新規テーブルを作る:

```sql
create table live_presales (
  id uuid primary key default gen_random_uuid(),
  live_id uuid not null references lives(id) on delete cascade,
  kind text not null,                  -- '先行抽選' | '一般販売' | 'FC先行' 等
  starts_at timestamptz not null,      -- 受付開始
  ends_at timestamptz,                 -- 受付終了
  url text,                            -- 申込 URL
  source text,                         -- 'fany' | 'manual'
  notified_new_at timestamptz,         -- 発見 push 済み（重複防止用。リマインドは Google カレンダー #114）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(live_id, kind, starts_at)
);
```

加えて `lives` に `source_url text`, `external_id text`, `notified_new_at timestamptz` を追加（Fany 由来レコードの突き合わせ + 新規ライブの発見 push 重複防止）。

### スクレイパー

- `src/lib/integrations/fany/`
  - `client.ts` — fetch + User-Agent 設定、rate limit（最低 1 req/sec）
  - `parser.ts` — HTML → `FanyLive[]` 構造体に変換（cheerio または HTMLRewriter）
  - `sync.ts` — `FanyLive[]` を `lives` / `live_presales` に upsert
    - `external_id` で既存判定
    - 出演者の自動タグ付けは issue #41 と統合
- `src/app/api/cron/fany/route.ts` — Vercel Cron から日次起動
  - `vercel.json` に `crons` 設定（`/api/cron/fany`, schedule `0 3 * * *` JST 12 時など）
  - `Authorization: Bearer ${CRON_SECRET}` で保護

### 通知トリガ（発見 push のみ）

> リマインド（抽選開始 / 締切間近 / 当日朝）は Google カレンダー委譲（#114）に移管したため、**別 `/api/cron/notify` は不要**。発見 push は Fany 同期（`/api/cron/fany`）の中で行う。

Fany 同期で **新規挿入された** `lives` / `live_presales` を検出して発見通知を送る。

**重要: Cron 重複起動やリトライでの多重送信を防ぐため、必ず単一の `UPDATE ... WHERE notified_new_at IS NULL RETURNING *` で原子的に「クレーム」した行に対してだけ通知を送る。**

```sql
-- 新規ライブの発見通知
update lives
set notified_new_at = now()
where notified_new_at is null
  and created_at >= now() - interval '1 day'
returning *;

-- 新規先行抽選の発見通知
update live_presales
set notified_new_at = now()
where notified_new_at is null
returning *;
```

1. 新規ライブの UPDATE → RETURNING 行に対して「新しいライブが追加されました」push
2. 新規先行抽選の UPDATE → RETURNING 行に対して「先行抽選が告知されました」push
3. push 本文には詳細ページ / カレンダー追加導線（#114）への URL を含める

通知本文の組み立てとプッシュ送信は `src/lib/push/sender.ts` を再利用。`push_subscriptions` 全件にループ送信、404/410 を捨てる。

> 送信失敗時は `notified_new_at = NULL` に戻して再走できる。リマインドは Google カレンダー側が担うため、本プランの push は「告知の発見」だけに責任を持つ。

---

## フェーズ 4: UI / 運用

- 管理画面 `/admin/notifications/`
  - 購読端末一覧（user_agent, last_seen_at）
  - テスト通知ボタン
  - 直近の通知送信ログ（必要なら `notification_logs` テーブル追加）
- 公開トップ
  - 「通知を受け取る」ボタン（フェーズ 2 で作るもの）
  - 説明文: 「先行抽選が始まったらスマホに通知が届きます」

---

## マイグレーション順序とフェーズ依存

| 順 | フェーズ | 依存 issue |
|----|---------|------------|
| 1 | PWA 基盤（manifest + SW）| 単独で完結 |
| 2 | Web Push 基盤（subscription + 送信 API + 管理画面テスト送信）| 1 完了後 |
| 3 | Fany 取得 + 先行抽選通知 | 2, #39（Vercel Cron 基盤）|
| 4 | 既存 issue #42 を Web Push に統合 / クローズ | 2 |

依存していないので、フェーズ 1〜2 を先行 PR、フェーズ 3 は ToS 確認後に別 PR で進めるのが安全。

---

## 関連 issue（新規作成案）

- PWA 化（manifest + service worker + Serwist 導入）
- Web Push subscription 基盤（DB + API + クライアント購読 UI）
- Fany スクレイパー + `live_presales` スキーマ
- 先行抽選通知 Cron
- #42 を Web Push へリプレース（クローズ or リネーム）

---

## 技術的な注意点

- **iOS**: PWA インストール済みでないと Web Push が動かない。インストール導線の説明 UI が必須。
- **VAPID キー**: 一度発行したら変更しない。変更すると既存 subscription が全部無効になる。
- **Vercel Cron**: 無料プランは日次 1 本まで。フェーズ 3 の 2 種類 Cron をまとめるか Pro プラン前提にするか要検討。
- **スクレイピング**: User-Agent を明示し、頻度を抑える。法的グレーなら手動入力に倒す（既存の管理画面入力 + `live_presales` だけ追加でも価値はある）。
- **テスト**: web-push のモック、Fany パーサのスナップショットテスト、SW は Playwright（issue #91）で疎通確認。
