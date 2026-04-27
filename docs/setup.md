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

## Step 9: Vercel デプロイ

1. Vercel で `dondecorte-lab` リポジトリを Import する（GitHub 連携）。
2. `Environment Variables` に次を設定する（Production / Preview）。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`（例: `https://dondecorte-lab.vercel.app`）
3. 初回デプロイ後に公開URLで表示を確認する。
4. YouTube サムネイル最適化のため `next.config.ts` の `images.remotePatterns` に `img.youtube.com` と `i.ytimg.com` が含まれていることを確認する。

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
[ ] デプロイ
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
