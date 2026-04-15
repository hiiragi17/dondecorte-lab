# DonDecorte Lab — ディレクトリ構成

## 技術スタック

- Next.js 15 (App Router)
- Supabase (DB + Auth)
- Tailwind CSS 4
- TypeScript
- react-hook-form (フォーム管理)
- Vercel (ホスティング)

---

## ディレクトリツリー

```
dondecorte-lab/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # ルートレイアウト（フォント、メタデータ）
│   │   ├── globals.css                   # Tailwind + カスタムCSS変数（カラーパレット）
│   │   │
│   │   ├── (public)/                     # ── 公開側（Route Group）──
│   │   │   ├── layout.tsx                # 公開側レイアウト（ヘッダー + ボトムナビ + フッター免責）
│   │   │   ├── page.tsx                  # トップページ
│   │   │   │
│   │   │   ├── videos/
│   │   │   │   ├── page.tsx              # 動画一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # 動画詳細（YouTube埋め込み + メモ）
│   │   │   │
│   │   │   ├── lives/
│   │   │   │   ├── page.tsx              # ライブ一覧（upcoming / past）
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # ライブ詳細 + メモ
│   │   │   │
│   │   │   ├── radios/
│   │   │   │   ├── page.tsx              # ラジオ一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # ラジオ詳細 + メモ
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx              # 記事一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # 記事詳細 + メモ
│   │   │   │
│   │   │   ├── tv/
│   │   │   │   ├── page.tsx              # TV一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # TV詳細 + メモ
│   │   │   │
│   │   │   ├── topics/
│   │   │   │   ├── page.tsx              # トピック一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # トピック詳細 + メモ
│   │   │   │
│   │   │   ├── combos/
│   │   │   │   ├── page.tsx              # コンビ一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # コンビ詳細（メンバー + タブ付きコンテンツ）
│   │   │   │
│   │   │   ├── artists/
│   │   │   │   ├── page.tsx              # 芸人一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # 芸人詳細（所属コンビ + 出演コンテンツ）
│   │   │   │
│   │   │   └── units/
│   │   │       ├── page.tsx              # ユニット一覧
│   │   │       └── [id]/
│   │   │           └── page.tsx          # ユニット詳細
│   │   │
│   │   ├── admin/                        # ── 管理画面 ──
│   │   │   ├── layout.tsx                # 管理画面レイアウト（サイドバー + 認証ガード）
│   │   │   ├── page.tsx                  # ダッシュボード（登録件数サマリ）
│   │   │   │
│   │   │   ├── artists/
│   │   │   │   ├── page.tsx              # 芸人一覧（テーブル表示）
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # 芸人新規作成
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx      # 芸人編集
│   │   │   │
│   │   │   ├── combos/
│   │   │   │   ├── page.tsx              # コンビ一覧
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # コンビ新規（メンバー紐付け含む）
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx      # コンビ編集
│   │   │   │
│   │   │   ├── units/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── videos/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # 動画登録（cast selector 付き）
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── lives/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── radios/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── tv/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   └── topics/
│   │   │       ├── page.tsx
│   │   │       ├── new/
│   │   │       │   └── page.tsx
│   │   │       └── [id]/
│   │   │           └── edit/
│   │   │               └── page.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── page.tsx              # ログインページ（非公開・URL直打ちのみ）
│   │   │
│   │   └── api/                          # API Routes（将来のPhase3用）
│   │       └── cron/
│   │           └── youtube/
│   │               └── route.ts          # YouTube自動取得（Phase3）
│   │
│   ├── components/
│   │   ├── ui/                           # ── 汎用UIコンポーネント ──
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx                 # 出演者タグ表示
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── loading.tsx
│   │   │   └── pagination.tsx
│   │   │
│   │   ├── layout/                       # ── レイアウト部品 ──
│   │   │   ├── header.tsx                # 公開側ヘッダー（ログインボタンなし）
│   │   │   ├── bottom-nav.tsx            # モバイル用ボトムナビ
│   │   │   ├── footer.tsx                # 免責事項フッター
│   │   │   ├── admin-sidebar.tsx         # 管理画面サイドバー
│   │   │   └── admin-header.tsx          # 管理画面ヘッダー
│   │   │
│   │   ├── features/                     # ── 機能別コンポーネント ──
│   │   │   │
│   │   │   ├── cast-selector/            # 【最重要】出演者選択（admin共通）
│   │   │   │   ├── cast-selector.tsx     # メインコンポーネント
│   │   │   │   ├── cast-tab.tsx          # Artist / Combo / Unit タブ
│   │   │   │   ├── cast-search.tsx       # 検索入力
│   │   │   │   └── cast-tag-list.tsx     # 選択済みタグ一覧
│   │   │   │
│   │   │   ├── video/
│   │   │   │   ├── video-card.tsx        # 動画カード（サムネ + タイトル + タグ）
│   │   │   │   ├── video-grid.tsx        # 動画グリッド
│   │   │   │   ├── video-player.tsx      # YouTube埋め込みプレーヤー
│   │   │   │   └── video-form.tsx        # 動画登録/編集フォーム（admin）
│   │   │   │
│   │   │   ├── live/
│   │   │   │   ├── live-card.tsx         # ライブ行表示
│   │   │   │   ├── live-list.tsx         # upcoming / past 分割リスト
│   │   │   │   └── live-form.tsx         # ライブ登録フォーム（admin）
│   │   │   │
│   │   │   ├── radio/
│   │   │   │   ├── radio-card.tsx
│   │   │   │   └── radio-form.tsx
│   │   │   │
│   │   │   ├── article/
│   │   │   │   ├── article-card.tsx
│   │   │   │   └── article-form.tsx
│   │   │   │
│   │   │   ├── tv/
│   │   │   │   ├── tv-card.tsx
│   │   │   │   └── tv-form.tsx
│   │   │   │
│   │   │   ├── topic/
│   │   │   │   ├── topic-card.tsx
│   │   │   │   └── topic-form.tsx
│   │   │   │
│   │   │   ├── artist/
│   │   │   │   ├── artist-profile.tsx    # プロフィール表示（SNSリンク付き）
│   │   │   │   ├── artist-stats.tsx      # 出演数カウント
│   │   │   │   └── artist-form.tsx       # 芸人登録フォーム（admin）
│   │   │   │
│   │   │   ├── combo/
│   │   │   │   ├── combo-profile.tsx     # コンビ詳細（SNS + メンバー）
│   │   │   │   ├── combo-content-tabs.tsx # タブ付きコンテンツ一覧
│   │   │   │   └── combo-form.tsx        # コンビ登録フォーム（admin）
│   │   │   │
│   │   │   ├── memo/
│   │   │   │   ├── memo-section.tsx      # メモ表示/入力セクション
│   │   │   │   └── memo-form.tsx         # メモ入力フォーム
│   │   │   │
│   │   │   └── sns/
│   │   │       └── sns-links.tsx         # SNSアイコンリンク一覧
│   │   │
│   │   └── shared/                       # ── 公開/管理 共通 ──
│   │       ├── performer-tags.tsx        # 出演者タグ表示（コンビ=水色、個人=茶色）
│   │       ├── content-type-badge.tsx    # コンテンツ種別バッジ（Video/Live/Radio等）
│   │       └── empty-state.tsx           # データなし時の表示
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # ブラウザ用 Supabase クライアント
│   │   │   ├── server.ts                 # サーバー用 Supabase クライアント
│   │   │   ├── middleware.ts             # 認証ミドルウェア
│   │   │   └── admin.ts                  # サービスロールキー付き（admin操作用）
│   │   │
│   │   ├── actions/                      # Server Actions
│   │   │   ├── artists.ts                # 芸人 CRUD
│   │   │   ├── combos.ts                 # コンビ CRUD + メンバー管理
│   │   │   ├── units.ts                  # ユニット CRUD
│   │   │   ├── videos.ts                 # 動画 CRUD + cast管理
│   │   │   ├── lives.ts                  # ライブ CRUD + cast管理
│   │   │   ├── radios.ts                 # ラジオ CRUD + cast管理
│   │   │   ├── articles.ts               # 記事 CRUD + cast管理
│   │   │   ├── tv-shows.ts               # TV CRUD + cast管理
│   │   │   ├── topics.ts                 # トピック CRUD + cast管理
│   │   │   └── memos.ts                  # メモ CRUD
│   │   │
│   │   ├── queries/                      # データ取得（Server Components用）
│   │   │   ├── artists.ts                # 芸人データ取得
│   │   │   ├── combos.ts                 # コンビデータ取得（メンバー含む）
│   │   │   ├── units.ts
│   │   │   ├── videos.ts                 # 動画取得（cast JOIN済み）
│   │   │   ├── lives.ts
│   │   │   ├── radios.ts
│   │   │   ├── articles.ts
│   │   │   ├── tv-shows.ts
│   │   │   ├── topics.ts
│   │   │   ├── memos.ts
│   │   │   └── top-page.ts              # トップページ用（最新動画 + 直近ライブ等）
│   │   │
│   │   ├── types/
│   │   │   ├── database.ts               # Supabase 自動生成型（supabase gen types）
│   │   │   └── index.ts                  # アプリ固有の型定義
│   │   │
│   │   └── utils/
│   │       ├── date.ts                   # 日付フォーマット
│   │       ├── youtube.ts                # YouTube URL → video ID 変換等
│   │       └── constants.ts              # 定数（コンテンツタイプ名、ナビ項目等）
│   │
│   ├── hooks/
│   │   ├── use-auth.ts                   # 認証状態フック
│   │   ├── use-memo.ts                   # メモ CRUD フック
│   │   └── use-debounce.ts               # 検索用デバウンス
│   │
│   └── middleware.ts                      # Next.js ミドルウェア（/admin 認証チェック）
│
├── public/
│   ├── favicon.ico
│   └── og-image.png                      # OGP画像
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql        # 設計書のSQL
│   └── seed.sql                          # 初期データ（ドンデコルテ関連）
│
├── .env.local                            # 環境変数（Supabase URL, Keys）
├── .env.example                          # 環境変数テンプレート
├── tailwind.config.ts                    # カスタムカラーパレット定義
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 設計のポイント

### 1. Route Group で公開/管理を分離

```
app/
  (public)/    ← URLに影響しない。layout.tsx でヘッダー+フッターを共有
  admin/       ← /admin/* で管理画面。別の layout.tsx でサイドバー表示
```

`(public)` は Route Group なので URL に影響しない。
`/videos` でアクセスできる（`/public/videos` にはならない）。

### 2. Server Components + Server Actions

```
公開ページ → Server Components（queries/ でデータ取得）
管理フォーム → Client Components + Server Actions（actions/ で書き込み）
メモ機能 → Client Components + hooks/use-memo.ts
```

Server Components をデフォルトにすることで、
初期表示が速く、SEO にも有利。

### 3. cast-selector が最重要コンポーネント

管理画面で5つのコンテンツ全てに使い回す。
設計を最初にしっかり作ることで、
残り4つのフォームは cast-selector を組み込むだけで完成する。

```tsx
// 使い方イメージ
<CastSelector
  selectedCasts={casts}
  onChange={setCasts}
/>
// casts = [
//   { type: 'comedy_group', id: 'xxx', name: 'ドンデコルテ' },
//   { type: 'artist', id: 'yyy', name: 'ゲスト芸人' },
// ]
```

### 4. queries/ と actions/ の分離

```
queries/  → SELECT のみ。Server Components から直接呼ぶ。
actions/  → INSERT/UPDATE/DELETE。Server Actions として "use server" 付き。
```

この分離により、データ取得ロジックと更新ロジックが混在しない。

### 5. Tailwind カスタムカラー

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      { DEFAULT: '#FBF7F1', dark: '#1A120B' },
          card:    { DEFAULT: '#FFFFFF', dark: '#2C1E14' },
          border:  { DEFAULT: '#E8D8C8', dark: '#3D2B1E' },
          brown:   { DEFAULT: '#5C3D2E', light: '#8B6347', dark: '#3D2B1E' },
          sky:     { DEFAULT: '#2E8FAD', light: '#6BB8D4', pale: '#E6F4F9' },
          text:    { DEFAULT: '#3D2B1E', muted: '#8B6347', dark: '#D4B896' },
          cream:   '#F0DFC8',
        }
      }
    }
  }
}
```

使い方: `bg-brand-bg dark:bg-brand-bg-dark`

### 6. 実装の優先順

ファイルを作る順番（依存関係順）:

```
1. lib/supabase/*          ← まずSupabase接続
2. lib/types/*             ← 型定義
3. middleware.ts            ← 認証ガード
4. components/layout/*     ← レイアウト枠
5. components/ui/*         ← 汎用UI
6. lib/queries/artists.ts  ← 最初のデータ取得
7. app/admin/artists/*     ← 最初のCRUD
8. components/features/cast-selector/* ← 最重要共通部品
9. app/admin/videos/*      ← cast-selector を使う最初のCRUD
10. 残りの admin CRUD       ← 8,9 のコピーで量産
11. 公開側ページ            ← queries/ を使って表示
12. メモ機能               ← 最後に追加
```

---

## ファイル数の目安

| カテゴリ | ファイル数 |
|---------|-----------|
| app/ pages | 約40 |
| components/ | 約35 |
| lib/ | 約25 |
| hooks/ | 3 |
| その他（config等） | 8 |
| **合計** | **約110** |

---

## 注意事項

### Image の扱い
- `image_url` は外部URL（YouTube サムネ等）を保存するだけ
- Supabase Storage は使わない（画像を自前ホスティングしない = 著作権対策）
- `next/image` の `remotePatterns` に `img.youtube.com` を追加

### 環境変数

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...    # admin操作用（サーバーのみ）
```

### 認証戦略（自分専用アプリ）

このアプリは自分しか管理しないので、認証は最小限に設計する。

**Supabase 側の設定:**
1. `Authentication > Settings > Disable sign ups` を ON
2. `Authentication > Users` から自分のアカウントを1つだけ手動作成（メール+パスワード）
3. Google OAuth 等のソーシャルログインは不要

**フロントエンド側のルール:**
- 公開ページのヘッダー、フッター、ナビゲーションにログインボタンやリンクを一切表示しない
- `/auth/login` はURL直打ちでのみアクセス可能（シンプルなメール+パスワードフォーム）
- 各コンテンツ詳細ページのメモ欄は全員に表示される（閲覧は公開）
- ログイン状態でのみ、メモの追加・編集・削除UIが出現する
- ログイン状態でのみ、ヘッダーに管理画面へのリンクが出現する

**アクセス制御まとめ:**

| ページ | 未ログイン | ログイン |
|--------|-----------|---------|
| 公開ページ（動画一覧等） | 閲覧可 | 閲覧可 |
| メモ欄（閲覧） | 閲覧可 | 閲覧可 |
| メモの追加・編集・削除 | 非表示 | 表示 + 入力可 |
| 管理画面リンク（ヘッダー） | 非表示 | 表示 |
| /admin/* | /auth/login にリダイレクト | アクセス可 |
| /auth/login | 表示（サイト上にリンクなし） | /admin にリダイレクト |

### middleware.ts の認証チェック

```ts
// /admin/* へのアクセスをガード
export const config = {
  matcher: ['/admin/:path*']
}
```
認証されていなければ /auth/login にリダイレクト。
