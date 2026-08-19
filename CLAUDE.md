# DonDecorte Lab

お笑いコンビ・ドンデコルテさんの非公式ファンサイト兼データベースアプリ。
動画・ライブ・ラジオ・記事・TV出演を一元管理し、推し活を支援する。

## 技術スタック

- Next.js 16 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS 4
- react-hook-form
- Vercel

## DB構成（22テーブル）

### 人・グループ系
- `artists` — 芸人個人（SNSカラム付き）
- `comedy_groups` — コンビ/トリオ（theme_color, youtube_channel_id, SNS付き）
- `comedy_group_members` — コンビのメンバー（role: ボケ/ツッコミ）
- `units` — ユニット（複数コンビ/個人の集合）
- `unit_members` — ユニット構成（コンビ or 個人、CHECK制約付き）
- `achievements` — 受賞歴（M-1等。artist/comedy_group/unitのいずれかに紐付け）

### コンテンツ系
- `videos` — YouTube動画（youtube_video_id UNIQUE）
- `lives` — ライブ（event_date, start_time, is_notified）
- `live_schedules` — ライブのチケットスケジュール（抽選・販売期間。phase_type=lottery/sale, start_date, end_date。lives へ FK、複数行可）
- `radios` — ラジオ
- `articles` — 記事/インタビュー（本文転載不可、リンクのみ）
- `tv_shows` — テレビ番組
- `cms` — CM・広告案件（advertiser, product, url, aired_on）
- `magazines` — 雑誌掲載（magazine_name, issue, publisher, url, published_on。本文転載不可、リンクのみ）
- `topics` — トピック/雑多な情報（写真撮影会、X投稿等。url, source付き）

### 出演（cast）系
- `video_casts`, `live_casts`, `radio_casts`, `article_casts`, `tv_show_casts`, `topic_casts`
- 全て同じ構造: artist_id / comedy_group_id / unit_id のうち1つだけNOT NULL
- CHECK制約: `(artist_id is not null)::int + (comedy_group_id is not null)::int + (unit_id is not null)::int = 1`

### パーソナル
- `memos` — ポリモーフィック設計（target_type + target_id）。閲覧は公開、書き込みは認証ユーザーのみ。

## ディレクトリ構成

```
src/
  app/
    (public)/          # 公開側（Route Group、URLに影響なし）
      page.tsx         # トップ
      videos/, lives/, radios/, articles/, tv/, cms/, magazines/, topics/
      combos/, artists/, units/
    admin/             # 管理画面（認証必須）
      artists/, combos/, units/, videos/, lives/, radios/, articles/, tv/, cms/, magazines/, topics/
    auth/login/        # ログイン（UI上にリンクなし、URL直打ちのみ）
  components/
    ui/                # 汎用UI（button, input, card, badge等）
    layout/            # header, footer, bottom-nav, admin-sidebar
    features/          # 機能別（cast-selector, video, live, memo, sns等）
    shared/            # performer-tags, content-type-badge
  lib/
    supabase/          # client.ts, server.ts, admin.ts, middleware.ts
    actions/           # Server Actions（INSERT/UPDATE/DELETE）
    queries/           # データ取得（SELECT。Server Componentsから呼ぶ）
    types/             # database.ts（自動生成）, index.ts（CastEntry等）
    utils/             # date.ts, youtube.ts, constants.ts
  hooks/               # use-auth, use-memo, use-debounce
  middleware.ts        # /admin/* 認証ガード
```

## カラーパレット

渡辺銀次さんの深い茶色 + 小橋共作さんの水色。

### ダークモード（公開側デフォルト）
- 背景: #1A120B / カード: #2C1E14 / ボーダー: #3D2B1E
- アクセント: #6BB8D4（水色）/ テキスト: #D4B896 / 見出し: #F0DFC8

### ライトモード（管理画面）
- 背景: #FBF7F1 / カード: #FFFFFF / ボーダー: #E8D8C8
- アクセント: #2E8FAD（水色）/ テキスト: #3D2B1E / サブ: #8B6347

Tailwindカスタムカラー: `brand-brown-*`, `brand-sky-*`, `brand-cream`, `brand-gold`, `brand-muted`

## 認証戦略

- 自分専用アプリ。Supabase Auth のサインアップ無効。
- ユーザーは手動で1つだけ作成済み（メール+パスワード）。
- 公開UIにログインボタン・リンクを一切表示しない。
- `/auth/login` はURL直打ちでのみアクセス可能。
- メモ欄は全員に表示（閲覧は公開）。ログイン状態でのみメモの編集・追加UIとヘッダーに管理画面リンクを表示。
- `/admin/*` は middleware.ts で認証ガード。

## コーディング規約

### Server Components優先
- 公開ページはServer Componentsでデータ取得（`lib/queries/`）
- フォームやインタラクティブ要素のみClient Components

### Server Actions
- `lib/actions/` に配置。`"use server"` 付き。
- cast処理は各actionsファイル内に含める（Phase4でservices層に分離予定）

### DB migration（GRANT 必須）
- 新しいテーブルを `create table` した直後、必ず以下を明示的に書く（2026-05-30 以降の Supabase 新挙動対応。`public` スキーマのテーブルはデフォルトでは Data API に公開されなくなる）:
  - 公開読み取り対象: `grant select on public.<table> to anon;` + `grant select, insert, update, delete on public.<table> to authenticated, service_role;`
  - 機微情報を含むテーブル（例: `push_subscriptions`）: anon は必要最小限のみ。読み書きはサーバ側 `service_role` 経由に限定する
- `serial` / `bigserial` / `generated ... as identity` を使うテーブルは、008 でデフォルト sequence 権限も revoke しているため、`grant usage, select on sequence public.<table>_<col>_seq to anon, authenticated, service_role;`（必要なロールのみ）も書く。本プロジェクトは現状すべて `uuid` 主キーなので不要だが、将来 serial / identity を採用する場合は忘れずに
- RLS だけでは PostgREST から `permission denied` で弾かれるため、`enable row level security` / `create policy` と **必ずセット** で `grant` を書く
- 新しい RPC 関数を `create function` したら `grant execute on function ... to authenticated;`（または `service_role`）を忘れずに
- 参考: `supabase/migrations/008_explicit_grants.sql`、https://github.com/orgs/supabase/discussions/45329
- migration の作成・適用は Supabase CLI で行う（`pnpm run db:new` → `pnpm run db:push`）。手順と注意点は `docs/supabase-cli.md` を参照

### cast-selector（最重要共通コンポーネント）
- 管理画面の6コンテンツ（video, live, radio, article, tv, topic）全てで使い回す
- Artist / Combo / Unit のタブ切り替え + 検索 + 選択タグ表示
- 型: `CastEntry = { type: 'artist' | 'comedy_group' | 'unit'; id: string; name: string }`

### メモのコンテンツ種別
- `ContentType = 'video' | 'live' | 'radio' | 'article' | 'tv_show' | 'topic' | 'cm' | 'magazine'`

### 著作権対応
- 画像は外部URL参照のみ（Supabase Storage不使用）
- 記事本文は転載不可（リンクのみ）
- YouTube埋め込みはAPIのサムネURLまたは公式埋め込みプレーヤーを使用
- フッターに非公式ファンサイトの免責事項を必ず表示

## GitHub PR ルール

- PR本文は**日本語**で書く
- assignee に `hiiragi17` を設定する
- 関連する issue がある場合は本文に `Closes #<番号>` を含めて紐付ける
- マージ後のブランチは自動削除（リポジトリ設定で `Automatically delete head branches` 有効化済み）

## レビューコメント対応ルール

PR には CodeRabbit / Codex などの bot レビューが付く。基本方針は以下:

### 適用判断

- **小さく明確な指摘**（typo / lint / markdown / 表記揺れ / docs の整合性等）→ 即座に修正コミット
- **セキュリティ / データ整合性の指摘**（RLS、race condition、SQL injection 等）→ 妥当性を検証して修正
- **アーキテクチャに影響する指摘**（責務分離、抽象化方針、依存関係の変更等）→ 自己判断せず `AskUserQuestion` で確認してから対応
- **複数 bot から同一指摘**が来た場合は 1 つの commit でまとめて反映する

### コミットメッセージ

- レビュー反映の commit は `docs: <内容> にCodeRabbitレビュー指摘を反映` のように内容を要約
- どの指摘を反映したか箇条書きで本文に残す（後追いしやすい）

### 返信ポリシー

- **bot / 人間問わず全てのレビューコメントにスレッド返信する**（`add_reply_to_pull_request_comment`）
  - CodeRabbit が `✅ Addressed in commit XXXXXXX` を自動追記するからといって返信を省略しない（後から人間がスレッドを読んだ時に対応の意図が分かるようにするため）
- 返信内容は「対応コミットの hash」+「何をどう変えたかの要約」を必ず含める
- 修正対応した thread は可能なら resolve する（`resolve_review_thread`）
- 「対応しない」判断をした場合は理由を明記してスレッド返信

### スキップしてよいケース

- bot の "Review in progress" の単なる進捗通知
- "Generate unit tests" 等の docs-only PR では無意味なオプション提案
- 既にコミット済みの修正と重複する指摘（返信で既対応を伝えるだけで OK）
- 自分の返信が webhook で echo されてきたケース
- bot がこちらの返信を確認して送ってくる「お礼 / 確認」自動返信（さらに返信すると無限ループになる）

## 詳細ドキュメント

詳細が必要な場合は `docs/` 内のファイルを参照:
- `docs/design.md` — DB設計（SQL全文）、タスク一覧、著作権注意事項
- `docs/directory.md` — ディレクトリ構成詳細、認証戦略、Tailwind設定
- `docs/setup.md` — セットアップ手順、初期コード（Supabaseクライアント、ミドルウェア等）
- `docs/issues.md` — GitHub issue定義（38件、ラベル・マイルストーン付き）
- `docs/supabase-cli.md` — Supabase CLI 運用（link / migration repair / db push / CI）
