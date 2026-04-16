# DonDecorte Lab — GitHub Issues

## 使い方

Claude Code に以下のように指示する:

```
このファイルを読んで、GitHubリポジトリに全issueを作成してください。
- gh CLIを使う
- ラベルがなければ先に作成する
- マイルストーンがなければ先に作成する
- issue本文はbodyの内容をそのまま使う
```

前提: `gh auth login` が完了していること。

---

## ラベル定義（先に作成）

```bash
gh label create "setup" --color "0E8A16" --description "環境構築・初期設定"
gh label create "db" --color "1D76DB" --description "データベース設計・マイグレーション"
gh label create "auth" --color "D93F0B" --description "認証・認可"
gh label create "admin" --color "FBCA04" --description "管理画面"
gh label create "public" --color "6BB8D4" --description "公開側ページ"
gh label create "component" --color "C5DEF5" --description "共通コンポーネント"
gh label create "ux" --color "D4C5F9" --description "UX改善"
gh label create "api" --color "0075CA" --description "API連携・自動化"
gh label create "feature" --color "A2EEEF" --description "新機能"
gh label create "design" --color "5C3D2E" --description "デザイン・カラー"
```

## マイルストーン定義（先に作成）

```bash
gh api repos/{owner}/{repo}/milestones -f title="Phase 1: MVP" -f description="自分用Wiki + 管理画面 + メモ機能" -f state="open"
gh api repos/{owner}/{repo}/milestones -f title="Phase 2: ブログ化 + UX強化" -f description="公開向け + お気に入り + フィルタ" -f state="open"
gh api repos/{owner}/{repo}/milestones -f title="Phase 3: 半自動化" -f description="YouTube自動取得 + 管理画面改善" -f state="open"
gh api repos/{owner}/{repo}/milestones -f title="Phase 4: 通知・分析" -f description="ライブ通知 + 共演分析 + 相関図" -f state="open"
```

---

## Phase 1: MVP

### issue: 1-1 Supabaseプロジェクト作成

- labels: setup, db
- milestone: Phase 1: MVP
- body: |
  ## やること
  - Supabaseでプロジェクト作成（Region: Tokyo）
  - API URL、anon key、service role keyを控える
  - `.env.local` に設定

  ## 完了条件
  - Supabaseダッシュボードにアクセスできる
  - 環境変数がローカルに設定済み

---

### issue: 1-2 DBマイグレーション実行

- labels: setup, db
- milestone: Phase 1: MVP
- body: |
  ## やること
  - `dondecorte-lab-design.md` のSQL全文をSupabase SQL Editorで実行
  - 19テーブルが作成されることを確認
  - RLSポリシーが適用されていることを確認
  - `supabase/migrations/001_initial_schema.sql` としてリポジトリに保存

  ## テーブル一覧（19）
  artists, comedy_groups, comedy_group_members, units, unit_members, achievements,
  videos, video_casts, lives, live_casts, radios, radio_casts,
  articles, article_casts, tv_shows, tv_show_casts, topics, topic_casts, memos

  ## 完了条件
  - Supabaseダッシュボードで全テーブルが確認できる
  - RLSが全テーブルで有効

---

### issue: 1-3 Next.jsプロジェクト初期化

- labels: setup
- milestone: Phase 1: MVP
- body: |
  ## やること
  - `create-next-app` でプロジェクト作成（TypeScript, Tailwind, App Router, src dir）
  - `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form` をインストール
  - Tailwindのカスタムカラーパレット設定（茶色 + 水色）
  - フォント設定（Noto Sans JP + Inter）
  - `.env.example` 作成

  ## 完了条件
  - `pnpm dev` でローカルサーバー起動確認
  - カスタムカラーがTailwindで使える

---

### issue: 1-4 Supabase Auth設定

- labels: setup, auth
- milestone: Phase 1: MVP
- body: |
  ## やること
  - Supabase Auth のメール認証を有効化
  - サインアップを無効化（自分だけ使うため）
  - 自分のアカウントを手動で1つ作成
  - `src/lib/supabase/client.ts`（ブラウザ用）作成
  - `src/lib/supabase/server.ts`（サーバー用）作成
  - `src/lib/supabase/admin.ts`（サービスロールキー用）作成

  ## 完了条件
  - Supabase Auth Usersに自分のアカウントが存在
  - サインアップが無効

---

### issue: 1-5 認証ミドルウェア

- labels: auth
- milestone: Phase 1: MVP
- body: |
  ## やること
  - `src/middleware.ts` 作成
  - `/admin/*` へのアクセスを認証ガード（未認証→`/auth/login`にリダイレクト）
  - `/auth/login` にログイン済みでアクセスしたら `/admin` にリダイレクト
  - `/auth/login` ページ作成（メール+パスワードのシンプルフォーム）
  - 公開側のUI（ヘッダー、ナビ、フッター）にログインリンクを一切表示しない

  ## 認証戦略
  - サイト上にログイン導線なし
  - `/auth/login` はURL直打ちのみ
  - ログイン状態でのみヘッダーに管理画面リンク表示

  ## 完了条件
  - 未認証で `/admin` → `/auth/login` にリダイレクト
  - ログイン → `/admin` にアクセスできる
  - 公開ページにログインボタンが存在しない

---

### issue: 1-6 管理画面レイアウト + サイドバー

- labels: admin, design
- milestone: Phase 1: MVP
- body: |
  ## やること
  - `src/app/admin/layout.tsx` 作成
  - サイドバー（左メニュー）: Artists, Combos, Units, Videos, Lives, Radios, Articles, TV, Topics, Achievements
  - ライトモード固定（クリーム背景 #FBF7F1）
  - `src/components/layout/admin-sidebar.tsx` 作成
  - `src/components/layout/admin-header.tsx` 作成
  - `src/app/admin/page.tsx`（ダッシュボード: 各テーブルの登録件数表示）

  ## 完了条件
  - `/admin` にサイドバー付きレイアウトが表示される
  - サイドバーの各メニューがリンクになっている

---

### issue: 1-7 管理画面：芸人 CRUD

- labels: admin
- milestone: Phase 1: MVP
- body: |
  ## やること
  - `src/app/admin/artists/page.tsx` — 芸人一覧（テーブル表示）
  - `src/app/admin/artists/new/page.tsx` — 新規作成フォーム
  - `src/app/admin/artists/[id]/edit/page.tsx` — 編集フォーム
  - `src/lib/actions/artists.ts` — Server Actions（create, update, delete）
  - `src/lib/queries/artists.ts` — データ取得
  - `src/components/features/artist/artist-form.tsx` — フォームコンポーネント

  ## フォーム項目
  - name（必須）, kana_name, profile, debut_year, image_url
  - SNS: x_url, instagram_url, note_url, youtube_channel_url, tiktok_url, website_url

  ## 完了条件
  - 芸人の一覧表示、新規作成、編集、削除ができる
  - react-hook-form でバリデーション

---

### issue: 1-8 管理画面：コンビ CRUD + メンバー紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-7"
- body: |
  ## やること
  - コンビ CRUD（artists と同じパターン）
  - メンバー紐付け UI（芸人を検索して追加、role入力: ボケ/ツッコミ）
  - `comedy_group_members` への INSERT/DELETE
  - `src/components/features/combo/combo-form.tsx`

  ## フォーム項目
  - name（必須）, kana_name, group_type（combo/trio/quartet/other）
  - description, formed_year, image_url, theme_color
  - SNS: x_url, instagram_url, note_url, youtube_channel_url, youtube_channel_id, standfm_url, tiktok_url, website_url
  - メンバー選択（artists テーブルから検索 + role入力）

  ## 完了条件
  - コンビの CRUD ができる
  - メンバーの追加・削除ができる（role付き）

---

### issue: 1-9 管理画面：ユニット CRUD + メンバー紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-8"
- body: |
  ## やること
  - ユニット CRUD
  - メンバー紐付け UI（コンビ単位 or 個人単位で追加）
  - `unit_members` のCHECK制約に対応

  ## 完了条件
  - ユニットの CRUD ができる
  - コンビ単位、個人単位でメンバーを追加できる

---

### issue: 1-10 管理画面：受賞歴 CRUD

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-7, #1-8"
- body: |
  ## やること
  - 受賞歴 CRUD（芸人 or コンビ or ユニットに紐付け）
  - 対象選択UI（Artist / Combo / Unit のいずれか1つ）

  ## フォーム項目
  - title（例: M-1グランプリ 2025）
  - result（例: 準優勝）
  - year
  - sort_order
  - 紐付け先（artist_id / comedy_group_id / unit_id のいずれか）

  ## 完了条件
  - 受賞歴の登録・編集・削除ができる

---

### issue: 1-11 cast-selector 共通コンポーネント

- labels: component
- milestone: Phase 1: MVP
- depends: "#1-7, #1-8, #1-9"
- body: |
  ## やること
  - `src/components/features/cast-selector/` 以下を実装
  - Artist / Combo / Unit のタブ切り替え
  - タブ内で名前検索（Supabaseにクエリ）
  - クリックで選択 → タグとして表示
  - タグの × で選択解除
  - 型: `CastEntry = { type: CastType; id: string; name: string }`

  ## 使い方イメージ
  ```tsx
  <CastSelector selectedCasts={casts} onChange={setCasts} />
  ```

  ## ファイル構成
  - cast-selector.tsx（メイン）
  - cast-tab.tsx（タブUI）
  - cast-search.tsx（検索入力）
  - cast-tag-list.tsx（選択済みタグ一覧）

  ## 完了条件
  - 3タブ切り替えで検索できる
  - 選択・解除が動作する
  - 動画フォームに組み込んで動作確認

---

### issue: 1-12 管理画面：動画 CRUD + 出演者紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-11"
- body: |
  ## やること
  - 動画 CRUD + cast-selector で出演者紐付け
  - `video_casts` への INSERT/DELETE
  - YouTube URL から video_id を自動抽出するユーティリティ

  ## フォーム項目
  - title, youtube_url, youtube_video_id（自動抽出）, youtube_channel_id
  - thumbnail_url, published_at, description
  - 出演者選択（cast-selector）

  ## 完了条件
  - 動画の CRUD ができる
  - cast-selector で出演者を紐付けできる

---

### issue: 1-13 管理画面：ライブ CRUD + 出演者紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-11"
- body: |
  ## やること
  - ライブ CRUD + cast-selector

  ## フォーム項目
  - title, event_date, start_time, venue, description, url, is_notified
  - 出演者選択（cast-selector）

  ## 完了条件
  - ライブの CRUD + 出演者紐付けができる

---

### issue: 1-14 管理画面：ラジオ CRUD + 出演者紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-11"
- body: |
  ## やること
  - ラジオ CRUD + cast-selector

  ## フォーム項目
  - title, platform, url, published_at, description
  - 出演者選択（cast-selector）

---

### issue: 1-15 管理画面：記事 CRUD + 出演者紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-11"
- body: |
  ## やること
  - 記事 CRUD + cast-selector

  ## フォーム項目
  - title, url, source, published_at, content（optional）
  - 出演者選択（cast-selector）

---

### issue: 1-16 管理画面：テレビ CRUD + 出演者紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-11"
- body: |
  ## やること
  - テレビ CRUD + cast-selector

  ## フォーム項目
  - title, network, air_date, air_time, description, url
  - 出演者選択（cast-selector）

---

### issue: 1-17 管理画面：トピック CRUD + 出演者紐付け

- labels: admin
- milestone: Phase 1: MVP
- depends: "#1-11"
- body: |
  ## やること
  - トピック CRUD + cast-selector
  - 雑多な情報を管理する汎用コンテンツ（写真撮影会、X投稿、CM情報等）

  ## フォーム項目
  - title（必須）, content（Markdown）, url（関連URL）
  - source（情報源: X, ワッハ上方 等）, topic_date
  - 出演者選択（cast-selector、任意）

  ## 完了条件
  - トピックの CRUD ができる
  - 出演者紐付けが任意でできる

---

### issue: 1-18 公開側レイアウト（ヘッダー + フッター + ボトムナビ）

- labels: public, design
- milestone: Phase 1: MVP
- body: |
  ## やること
  - `src/app/(public)/layout.tsx` 作成
  - `src/components/layout/header.tsx` — ロゴ + ナビ（ログインボタンなし）
  - `src/components/layout/footer.tsx` — 免責事項表示
  - `src/components/layout/bottom-nav.tsx` — モバイル用（Home/Videos/Lives/Artists/More）
  - ダークモードのカラーパレット適用（茶色ベース + 水色アクセント）
  - ログイン状態ではヘッダーに管理画面リンクを表示

  ## 免責文
  「本サイトはドンデコルテおよび吉本興業とは無関係の非公式ファンサイトです。
  掲載情報の正確性は保証しません。権利者様からの削除要請には速やかに対応いたします。」

  ## 完了条件
  - ヘッダー + フッターが表示される
  - モバイルでボトムナビが表示される
  - ログインボタンが公開UIに存在しない

---

### issue: 1-19 公開側：トップページ

- labels: public
- milestone: Phase 1: MVP
- depends: "#1-18"
- body: |
  ## やること
  - `src/app/(public)/page.tsx`
  - セクション構成（上から）:
    1. 直近のライブ予定（upcoming lives）
    2. 最新動画（3件グリッド）
    3. 最近追加されたコンテンツ
  - `src/lib/queries/top-page.ts` でデータ取得

  ## 完了条件
  - トップページに3セクションが表示される
  - Server Component でSSR

---

### issue: 1-20 公開側：動画一覧 + 詳細

- labels: public
- milestone: Phase 1: MVP
- depends: "#1-18"
- body: |
  ## やること
  - `/videos` — グリッド表示（PC3列、モバイル2列）
  - `/videos/[id]` — YouTube埋め込み + タイトル + 出演者タグ + 説明 + 関連動画
  - 出演者タグはクリックでコンビ/芸人詳細に遷移
  - `src/components/features/video/video-card.tsx`
  - `src/components/features/video/video-grid.tsx`
  - `src/components/features/video/video-player.tsx`

  ## 完了条件
  - 動画一覧がサムネ付きで表示される
  - 詳細ページでYouTube動画が埋め込み再生できる
  - 出演者タグがリンクとして機能する

---

### issue: 1-21 公開側：ライブ一覧

- labels: public
- milestone: Phase 1: MVP
- depends: "#1-18"
- body: |
  ## やること
  - `/lives` — Upcoming（水色左ボーダー）と Past に分割表示
  - 日付、タイトル、会場、出演者タグ
  - `src/components/features/live/live-card.tsx`
  - `src/components/features/live/live-list.tsx`

  ## 完了条件
  - 未来のライブが目立つ表示になっている
  - 過去のライブが時系列で表示される

---

### issue: 1-22 公開側：コンビ/芸人 詳細ページ

- labels: public
- milestone: Phase 1: MVP
- depends: "#1-18"
- body: |
  ## やること
  - `/combos/[id]` — プロフィール + SNSリンク + 受賞歴 + メンバー + タブ付きコンテンツ
  - `/artists/[id]` — プロフィール + SNSリンク + 受賞歴 + 所属コンビ + 出演コンテンツ
  - タブ: Videos / Lives / Radio / TV / Articles
  - `src/components/features/combo/combo-profile.tsx`
  - `src/components/features/combo/combo-content-tabs.tsx`
  - `src/components/features/sns/sns-links.tsx`
  - `src/components/shared/performer-tags.tsx`

  ## 完了条件
  - コンビ詳細に受賞歴、SNSリンク、メンバー、タブ付きコンテンツが表示される
  - 芸人詳細に所属コンビと出演コンテンツが表示される
  - タグ、メンバーカードがリンクとして機能する（回遊導線）

---

### issue: 1-23 公開側：ラジオ・記事・TV・トピック一覧

- labels: public
- milestone: Phase 1: MVP
- depends: "#1-18"
- body: |
  ## やること
  - `/radios` — ラジオ一覧（プラットフォーム + リンク）
  - `/articles` — 記事一覧（出典 + 外部リンク。本文転載なし）
  - `/tv` — TV一覧（放送局バッジ + 日付）
  - `/topics` — トピック一覧（情報源 + 日付 + 関連URL）
  - 各詳細ページ

  ## 完了条件
  - 4種類のコンテンツが一覧表示される
  - 記事は外部リンクのみ（著作権対応）
  - トピックに情報源と関連URLが表示される

---

### issue: 1-24 メモ機能

- labels: feature, auth
- milestone: Phase 1: MVP
- depends: "#1-20, #1-5"
- body: |
  ## やること
  - `src/components/features/memo/memo-section.tsx` — メモ表示（Server Component、全員向け）
  - `src/components/features/memo/memo-editor.tsx` — メモ追加/編集UI（Client Component、ログイン時のみマウント）
  - `src/lib/queries/memos.ts` — メモ取得（公開）
  - `src/lib/actions/memos.ts` — Server Actions（書き込みは認証必須）
  - `src/hooks/use-memo.ts` — メモ CRUD フック
  - 各コンテンツ詳細ページにメモセクションを追加
  - 閲覧は全員可能。ログイン時のみ追加・編集・削除ボタンを表示

  ## ポリモーフィック設計
  - target_type: 'video' | 'live' | 'radio' | 'article' | 'tv_show' | 'topic'
  - target_id: 対象コンテンツのUUID

  ## RLSポリシー
  - SELECT: 公開（anon, authenticated）
  - INSERT / UPDATE / DELETE: authenticated のみ

  ## 完了条件
  - 各詳細ページでメモが全員に表示される
  - ログイン状態でのみメモの追加・編集・削除UIが表示される
  - 未ログインでは閲覧のみで編集UIは非表示
  - メモの保存、編集、削除ができる（ログイン時）

---

### issue: 1-25 Vercelデプロイ + 環境変数設定

- labels: setup
- milestone: Phase 1: MVP
- body: |
  ## やること
  - Vercelにプロジェクト接続（GitHub連携）
  - 環境変数設定（SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY）
  - `next.config.ts` で `images.remotePatterns` に `img.youtube.com` 追加
  - 本番デプロイ確認

  ## 完了条件
  - `dondecorte-lab.vercel.app` でアクセスできる
  - 環境変数が正しく設定されている

---

### issue: 1-26 初期データ投入

- labels: db
- milestone: Phase 1: MVP
- depends: "#1-25"
- body: |
  ## やること
  - `supabase/seed.sql` 作成
  - ドンデコルテ関連の初期データ:
    - artists: 小橋共作、渡辺銀次
    - comedy_groups: ドンデコルテ（theme_color, SNS含む）
    - comedy_group_members: 2人分（role: ツッコミ/ボケ）
    - achievements: M-1 2019〜2025の成績、R-1 2026
    - videos: YouTube公式チャンネルから主要動画
    - lives: 単独ライブ第一回〜第九回
    - radios: 公式雑談、がっちゃんこ、REQ JAM

  ## 完了条件
  - seed実行後、公開ページにデータが表示される

---

## Phase 2: ブログ化 + UX強化

### issue: 2-1 タグ機能（DB + 管理画面）

- labels: db, admin, feature
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - tags, taggings テーブル追加
  - 管理画面でタグ管理UI

### issue: 2-2 記事ページ（Markdown対応）

- labels: public, feature
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - Markdown で記事を書いて表示できる機能
  - コンテンツ例:「おすすめネタ5選」「ドンデコルテとは」

### issue: 2-3 SEO対応

- labels: public
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - メタタグ（title, description）動的生成
  - OGP画像
  - sitemap.xml 自動生成

### issue: 2-4 関連コンテンツ表示

- labels: public, ux
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - 詳細ページに関連コンテンツセクション追加
  - 同じ出演者のコンテンツを表示

### issue: 2-5 レスポンシブ対応強化

- labels: design, ux
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - 全ページのモバイル表示を調整

### issue: 2-6 お気に入り機能

- labels: feature, db
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - favorites テーブル追加
  - お気に入り登録/解除UI
  - お気に入り一覧ページ

### issue: 2-7 タイムライン表示

- labels: feature, public
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - 全コンテンツを時系列で一本のタイムラインに表示
  - コンテンツ種別バッジ付き

### issue: 2-8 フィルタ・並び替え

- labels: ux, public
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - 一覧ページに並び替え（新着順/古い順）
  - 出演者フィルタ

### issue: 2-9 タブ横スクロール対応

- labels: ux, design
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - コンビ/芸人詳細のコンテンツタブをモバイルで横スクロール可能にする

### issue: 2-10 視聴済みフラグ

- labels: feature
- milestone: Phase 2: ブログ化 + UX強化
- body: |
  ## やること
  - 動画に「見た」フラグをつけられる機能
  - 視聴済み/未視聴のフィルタ

---

## Phase 3: 半自動化

### issue: 3-1 YouTube Data API セットアップ

- labels: api, setup
- milestone: Phase 3: 半自動化
- body: |
  ## やること
  - Google Cloud でAPIキー取得
  - YouTube Data API v3 有効化

### issue: 3-2 YouTube動画自動取得

- labels: api, feature
- milestone: Phase 3: 半自動化
- body: |
  ## やること
  - チャンネルIDで動画一覧取得
  - youtube_video_id で重複チェック
  - 新着のみDBに保存

### issue: 3-3 Vercel Cron設定

- labels: api, setup
- milestone: Phase 3: 半自動化
- body: |
  ## やること
  - `src/app/api/cron/youtube/route.ts` 作成
  - Vercel Cronで毎日1回実行

### issue: 3-4 自動取得動画のレビュー機能

- labels: admin, feature
- milestone: Phase 3: 半自動化
- body: |
  ## やること
  - 自動取得した動画を管理画面で承認/却下
  - 出演者の手動タグ付け

### issue: 3-5 出演者自動タグ付け

- labels: api, feature
- milestone: Phase 3: 半自動化
- body: |
  ## やること
  - 動画タイトルから出演者を推定
  - Claude Code Routines との連携検討

---

## Phase 4: 通知・分析

### issue: 4-1 ライブ通知

- labels: feature
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - ドンデコルテ出演ライブの通知（メール or LINE Notify）
  - is_notified フラグで送信済み管理

### issue: 4-2 Googleカレンダー連携

- labels: feature, api
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - ライブ情報をGoogleカレンダーに自動追加

### issue: 4-3 共演分析ページ

- labels: feature, public
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - ドンデコルテと最も共演が多いコンビ/芸人をランキング表示

### issue: 4-4 出演回数ランキング

- labels: feature, public
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - コンテンツ種別ごとの出演回数集計

### issue: 4-5 相関図（D3.js）

- labels: feature, public
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - 共演データからネットワークグラフを生成

### issue: 4-6 cast統合テーブル

- labels: db
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - video_casts, live_casts等を統合した casts テーブルに移行
  - 共演分析のUNION回避

### issue: 4-7 Server Actions → services層 分離

- labels: setup
- milestone: Phase 4: 通知・分析
- body: |
  ## やること
  - lib/services/ を作成
  - cast処理、バリデーション、トランザクションをservicesに切り出し
  - actionsは薄いラッパーにする
