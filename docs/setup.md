# DonDecorte Lab — セットアップガイド

## Step 0: 事前準備

### Supabase（ブラウザで手動）

1. https://supabase.com にアクセスしてアカウント作成（GitHub連携が楽）
2. 「New Project」でプロジェクト作成
   - Name: `dondecorte-lab`
   - Database Password: 控えておく
   - Region: `Northeast Asia (Tokyo)` を選択
3. プロジェクト作成後、以下を控える:
   - `Settings > API > Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `Settings > API > anon public key` → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `Settings > API > service_role key` → SUPABASE_SERVICE_ROLE_KEY（秘密）
4. `SQL Editor` で `dondecorte-lab-design.md` 内のSQL全文を実行
5. 認証設定:
   - `Authentication > Providers > Email` が有効であることを確認
   - `Authentication > Settings > Enable email confirmations` を OFF（開発中は）
   - `Authentication > Settings > Allow new users to sign up` を OFF
   - `Authentication > Users > Add user` で自分のアカウントを1つだけ作成

---

## Step 1: Next.js プロジェクト初期化

```bash
pnpm create next-app dondecorte-lab \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd dondecorte-lab
```

---

## Step 2: 依存パッケージ追加

```bash
pnpm add @supabase/supabase-js @supabase/ssr react-hook-form
```

---

## Step 3: 環境変数

`.env.local` を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

`.env.example` も作成（キーなし版、Git管理用）:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`.gitignore` に `.env.local` が含まれていることを確認。

---

## Step 4: Supabase クライアント

### `src/lib/supabase/client.ts`（ブラウザ用）

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `src/lib/supabase/server.ts`（Server Components / Server Actions 用）

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component からの呼び出し時は無視
          }
        },
      },
    }
  );
}
```

### `src/lib/supabase/admin.ts`（サービスロールキー付き）

```ts
import { createClient } from "@supabase/supabase-js";

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## Step 5: 認証ミドルウェア

### `src/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/* は認証必須
  if (request.nextUrl.pathname.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ログイン済みで /auth/login にアクセスしたら /admin へ
  if (request.nextUrl.pathname === "/auth/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
```

---

## Step 6: Tailwind カスタムカラー

Tailwind 4 では CSS ファーストの `@theme` ディレクティブで設定する（`tailwind.config.ts` は不要）。

### `src/app/globals.css`

```css
@import "tailwindcss";

@theme inline {
  /* フォント */
  --font-sans: var(--font-noto-sans-jp), var(--font-inter), sans-serif;

  /* 茶色系（渡辺さんベース） */
  --color-brand-brown: #5C3D2E;
  --color-brand-brown-light: #8B6347;
  --color-brand-brown-dark: #3D2B1E;
  --color-brand-brown-muted: #6B4C35;

  /* 水色系（小橋さんアクセント） */
  --color-brand-sky: #2E8FAD;
  --color-brand-sky-light: #6BB8D4;
  --color-brand-sky-pale: #E6F4F9;
  --color-brand-sky-hover: #A8D8EA;
  --color-brand-sky-dark: #4A96B3;

  /* テキスト・装飾 */
  --color-brand-cream: #F0DFC8;
  --color-brand-gold: #D4B896;
  --color-brand-muted: #A68B6B;

  /* ダークモード背景系 */
  --color-brand-bg-dark: #1A120B;
  --color-brand-card-dark: #2C1E14;
  --color-brand-border-dark: #3D2B1E;

  /* ライトモード背景系 */
  --color-brand-bg-light: #FBF7F1;
  --color-brand-card-light: #FFFFFF;
  --color-brand-border-light: #E8D8C8;
}
```

---

## Step 7: 型定義

### `src/lib/types/index.ts`

```ts
// 出演者の型（cast-selector で使う）
export type CastType = "artist" | "comedy_group" | "unit";

export type CastEntry = {
  type: CastType;
  id: string;
  name: string;
};

// コンテンツ種別（メモで使う）
export type ContentType = "video" | "live" | "radio" | "article" | "tv_show" | "topic";

// SNSリンク
export type SnsLinks = {
  x_url?: string | null;
  instagram_url?: string | null;
  note_url?: string | null;
  youtube_channel_url?: string | null;
  standfm_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
};
```

Supabase の自動生成型も追加:

```bash
pnpm dlx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

---

## Step 8: SQL マイグレーションファイル

```bash
mkdir -p supabase/migrations
```

`dondecorte-lab-design.md` 内のSQL全文を
`supabase/migrations/001_initial_schema.sql` として保存。

---

## Step 9: YouTube Data API セットアップ

YouTube 公式チャンネルから動画を自動取得する（issue #38）ための準備。
**ブラウザでの手動作業**で、APIキーの取得まで行う。

### 9-1. Google Cloud プロジェクト

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを新規作成（既存プロジェクトの流用でも可）

### 9-2. YouTube Data API v3 を有効化

1. 「APIとサービス」→「ライブラリ」を開く
2. 「YouTube Data API v3」を検索し、**有効にする**

### 9-3. APIキーを発行

1. 「APIとサービス」→「認証情報」→「認証情報を作成」→「APIキー」
2. 発行されたキーをコピー
3. キーを編集し、**APIの制限**で「YouTube Data API v3」のみに絞る（漏洩時の被害を最小化）
4. アプリケーションの制限は、サーバサイド（Vercel）から呼ぶため「なし」または IP 制限

> ⚠️ `YOUTUBE_API_KEY` は**サーバサイド専用**。ブラウザに送信されるコード（Client Components 等）には絶対に含めないこと。
> 環境変数名に `NEXT_PUBLIC_` プレフィックスを付けないことで、Next.js がこの値をクライアントバンドルに含めずサーバ側のみに閉じる。

### 9-4. 環境変数に登録

`.env.local` に追記:

```env
YOUTUBE_API_KEY=AIza...
```

Vercel の環境変数にも同じキーを登録する（`Production` / `Preview`）。

### 9-5. クォータの注意

- 無料枠は **1日 10,000 ユニット**。
- `playlistItems.list` は 1 リクエスト 1 ユニットと安価。`search.list` は 100 ユニットと高価なので、
  動画一覧の取得はチャンネルのアップロード再生リスト（`playlistItems`）経由を推奨（issue #38 で実装）。

### 補足

- ドンデコルテ公式チャンネルID: `UC4y-_Xwudf7gB5sXsbipDkQ`
- このStepはAPIキーの取得まで。実際の取得処理は issue #38、定期実行は #39 で実装する。

---

## Step 10: Vercel デプロイ

1. Vercel で `dondecorte-lab` リポジトリを Import する（GitHub 連携）。
2. 環境変数に次を設定する（Production / Preview）。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`（例: `https://dondecorte-lab.vercel.app`）
   - `YOUTUBE_API_KEY`（YouTube 動画自動取得 / Cron で使用。Step 9 参照）
   - `CRON_SECRET`（Cron 認証用。`openssl rand -hex 32` 等で生成。Step 11 参照）
3. 初回デプロイ後に公開URLで表示を確認する。
4. YouTube サムネイル最適化のため `next.config.ts` の `images.remotePatterns` に `img.youtube.com` と `i.ytimg.com`（いずれも `/vi/**`）が含まれていることを確認する。

---

## Step 11: Cron（YouTube動画自動取得）セットアップ

`/api/cron/youtube` を Vercel Cron が日次で叩き、`comedy_groups.youtube_channel_id` に登録された各チャンネルから新着動画を `videos` テーブルへ取り込む（issue #39 / #38）。

> ℹ️ このルートは **Vercel Cron 専用のバックグラウンドジョブ**で、公開ページの表示には一切関与しない。失敗しても公開サイトにエラーは出ず、その日の取り込みがスキップされるだけ（1日1回実行）。

### 11-1. スケジュール

`vercel.json` の `crons` に設定済み。

```json
{
  "crons": [{ "path": "/api/cron/youtube", "schedule": "0 3 * * *" }]
}
```

- `0 3 * * *` = UTC 03:00 = **JST 12:00**。
- Vercel 無料(Hobby)プランは日次粒度の Cron 1 本まで。

### 11-2. 必要な環境変数（Vercel）

| 変数 | 用途 | 未設定時の挙動 |
| --- | --- | --- |
| `CRON_SECRET` | Cron 認証。Vercel が `Authorization: Bearer <CRON_SECRET>` を自動付与 | ルートが**常に 401**（誰でも叩ける状態を避けるため一律拒否） |
| `YOUTUBE_API_KEY` | YouTube Data API v3（Step 9） | 全チャンネル同期が失敗 → **500** |

- `CRON_SECRET` は `openssl rand -hex 32` 等で生成し、Production（必要なら Preview）に登録する。
- 設定変更後は再デプロイで反映。

### 11-3. 前提データ

- 本番 Supabase の `comedy_groups.youtube_channel_id` にチャンネルIDが入っていること（公式: `UC4y-_Xwudf7gB5sXsbipDkQ`）。`supabase/seed.sql`（#26）を流すと投入される。未投入なら巡回対象 0 件（エラーにはならず `200 / channels:0`）。

### 11-4. 手動テスト

デプロイ後、ローカルから手動で叩いて確認できる（`$CRON_SECRET` は Vercel に設定した値）。

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://dondecorte-lab.vercel.app/api/cron/youtube
```

- `200 { ok: true, channels, inserted, outcomes }` … 正常（`inserted` が新規取り込み件数）
- `401` … `CRON_SECRET` 不一致 / 未設定
- `500 { ok: false }` … 登録チャンネルがあるのに全件失敗（`YOUTUBE_API_KEY` 不正 / YouTube API 障害など）

実行履歴とログは Vercel の **Cron Jobs / Functions ログ**で確認する。

---

## Googleカレンダー購読 (ICS フィード)

`/lives.ics` を Google カレンダーに URL 購読すると、ドンデコルテ出演ライブが自動でカレンダーに表示される。

### 購読手順

1. https://calendar.google.com を開く
2. 左サイドバー「他のカレンダー」→ 「+」 → 「URL で追加」
3. 以下の URL を入力して追加:
   - 本番: `https://dondecorte-lab.vercel.app/lives.ics`
4. 「カレンダーを追加」

> ⚠️ Google カレンダーは購読 URL に外部から到達できる必要があるため、
> `http://localhost:3000/lives.ics` を直接購読することはできません。
> ローカルで検証する場合は ngrok / Cloudflare Tunnel 等で公開 URL を払い出してください。

### 補足

- Google 側の更新は数時間〜半日ラグがある（フィード方式の仕様）
- `event_date` が設定されたライブのみ対象
- `start_time` あり → 2 時間予定 / `start_time` なし → 終日予定
- 即時反映が必要になったら issue #43（OAuth で直接書き込み）を検討

## カレンダー view + イベント個別追加 (#114)

`/lives.ics` の「全件まとめて URL 購読」に対し、`/calendar` では **見たいライブを 1 件ずつ**
Google カレンダーへ追加できる。

### カレンダー view

- `/calendar` … 月表示（日曜始まり）+「これからのライブ」リスト
- `?ym=YYYY-MM` で表示月を切り替え（前月 / 翌月リンク）
- 月セルのライブはライブ詳細へリンク

### 個別追加導線

ライブ詳細（`/lives/[id]`）と `/calendar` のリスト項目に、以下 2 つのボタンを表示する。

1. **Google カレンダーに追加**（テンプレート URL / ワンタップ）
   - `src/lib/calendar/google-url.ts` が生成
   - `ctz=Asia/Tokyo`。時刻指定は `dates=...T.../...T...`、終日は `dates=YYYYMMDD/翌日`
   - ⚠️ テンプレート URL は **リマインド時刻を指定できない**（ユーザー既定の通知になる）
2. **.ics で追加**（`GET /lives/[id].ics` 相当 → 実体は `/lives/[id]/ics`）
   - VALARM 付き。`start_time` あり → 前日 + 2 時間前 / なし → 前日のみ
   - リマインド時刻を初期設定したい場合はこちらを使う（Google 含む任意アプリに取り込み可）

### スコープ

- 先行抽選期間（`live_presales`）の重ね表示は #97（Fany 連携）でテーブルが用意され次第に対応予定。
  本対応はライブ日のみで先行リリースしている。
- VALARM 生成は `src/lib/ics/builder.ts` の `reminders?: { minutesBefore }[]` で対応。

---

## 実装順序チェックリスト

ここまで完了したら、以下の順で実装を進める:

```
[x] Step 0: Supabase プロジェクト作成 + SQL実行
[x] Step 1: Next.js 初期化
[x] Step 2: パッケージ追加
[x] Step 3: 環境変数
[x] Step 4: Supabase クライアント
[x] Step 5: 認証ミドルウェア
[x] Step 6: Tailwind カスタムカラー
[x] Step 7: 型定義
[x] Step 8: SQLマイグレーション保存
[ ] Step 9: Vercel デプロイ
--- ここから Claude Code で実装 ---
[ ] ログインページ（/auth/login）
[ ] 管理画面レイアウト（サイドバー）
[ ] 公開側レイアウト（ヘッダー + フッター + ボトムナビ）
[ ] 管理画面：芸人 CRUD（最初のCRUD）
[ ] 管理画面：コンビ CRUD + メンバー紐付け
[ ] cast-selector 共通コンポーネント
[ ] 管理画面：動画 CRUD（cast-selector使用）
[ ] 残りの管理画面 CRUD
[ ] 公開側ページ
[ ] メモ機能
```

---

## Claude Code での実装のコツ

Claude Code に以下のファイルをコンテキストとして渡すと効率的:

1. `dondecorte-lab-design.md` — DB設計・タスク一覧
2. `dondecorte-lab-directory.md` — ディレクトリ構成・技術設計・認証戦略

プロンプト例:

```
このプロジェクトの設計書を読んで、管理画面の芸人CRUDを実装してください。
- Server Actionsでデータ更新
- react-hook-formでフォーム管理
- SNSリンク入力欄も含める
```

```
cast-selectorコンポーネントを実装してください。
- Artist / Combo / Unit のタブ切り替え
- 検索入力でフィルタ
- 選択済みをタグ表示 + 削除可能
- 設計書のCastEntry型を使う
```
