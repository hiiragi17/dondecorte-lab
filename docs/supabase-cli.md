# Supabase CLI 運用

これまで migration は Supabase ダッシュボードの SQL Editor に手貼りしていたが、
Supabase CLI から `supabase/migrations/*.sql` をそのまま本番へ適用できる構成に切り替えた。

- CLI バージョン: **2.115.0**（`package.json` の `scripts.supabase` と CI で固定）
- 設定ファイル: `supabase/config.toml`

## なぜ devDependency にしないのか

`supabase` npm パッケージ本体は 28KB だが、実体はプラットフォーム別の
optionalDependencies（`@supabase/cli-linux-x64` 等）で **約 152MB** ある。
devDependencies に入れると Vercel の毎ビルドでこれを取得することになり、
デプロイに何の関係もないバイナリでビルドを重くしてしまう。

そのため `pnpm dlx supabase@2.115.0` をラップした npm script として持つ。
バージョンは `scripts.supabase` の 1 箇所だけで管理する。

```jsonc
"supabase":  "pnpm dlx supabase@2.115.0",
"db:new":    "pnpm run supabase migration new",
"db:status": "pnpm run supabase migration list --linked",
"db:push":   "pnpm run supabase db push --linked",
"db:diff":   "pnpm run supabase db diff --linked"
```

任意の CLI コマンドは `pnpm run supabase <任意の引数>` で叩ける。

## 初回セットアップ（1 回だけ / ローカルマシンで実行）

### 1. ログイン

```bash
pnpm run supabase login
# CI や非対話環境では環境変数でも可
# export SUPABASE_ACCESS_TOKEN=sbp_...
```

### 2. プロジェクトに link

```bash
pnpm run supabase link --project-ref <project-ref>
```

`<project-ref>` は Supabase ダッシュボードの URL（`https://supabase.com/dashboard/project/<project-ref>`）
または `NEXT_PUBLIC_SUPABASE_URL` のサブドメイン部分。DB パスワードを聞かれる。

### 3. `major_version` を本番に合わせる

`supabase/config.toml` の `db.major_version` は現在 `17`。本番と違う場合は
シャドウ DB を使うコマンド（`db diff` / `db reset`）が食い違うので、必ず確認して合わせる。

```sql
-- Supabase の SQL Editor で実行
show server_version;
```

### 4. migration 履歴の修復（**最重要**）

本番にはすでに 001〜012 が手作業で適用済みだが、CLI が見る
`supabase_migrations.schema_migrations` には履歴が無い。
このまま `db push` すると 001 から流し直そうとするので、
先に「適用済み」として履歴だけ登録する。

```bash
pnpm run supabase migration repair --status applied \
  001 002 003 004 005 006 007 008 009 010 011 012

# local / remote が揃っていることを確認
pnpm run db:status
```

## 日常の流れ

```bash
# 1. 新しい migration ファイルを作る（20260819123045_add_foo.sql が生成される）
pnpm run db:new add_foo

# 2. SQL を書く（GRANT の書き忘れに注意 → CLAUDE.md「DB migration」節）

# 3. 差分を確認
pnpm run db:status

# 4. 本番へ適用
pnpm run db:push
```

`--dry-run` を付けると適用されるファイルの一覧だけ表示できる。

```bash
pnpm run supabase db push --linked --dry-run
```

### ファイル名の規約

既存の `001_initial_schema.sql` 〜 `012_fany_columns_forward.sql` はそのままで CLI が認識する
（version として数字プレフィクスを読む）。今後 `supabase migration new` が作る
`20260819123045_*.sql` 形式と混在しても、`0...` < `2...` で適用順は崩れない。

### seed

`supabase/seed.sql` は psql のメタコマンド `\ir` で分割ファイルを読み込んでいるが、
CLI は psql を経由せず DB に直接流すため `\ir` は **syntax error になる**。
そのため `config.toml` 側では分割ファイルを直接 glob 指定している。

```toml
[db.seed]
sql_paths = ["./seeds/*.sql"]
```

`seed.sql` は psql から手で流す用（`psql "$SUPABASE_DB_URL" -f supabase/seed.sql`）として残している。

## CI（`.github/workflows/db-migration.yml`）

`supabase/**` を変更した PR で自動実行される。**本番 Supabase には接続しない。**

1. GitHub Actions の `postgres:17` サービスコンテナを起動
2. `anon` / `authenticated` / `service_role` ロールを作成（実 Supabase には最初から在る）
3. `supabase db push --db-url ... --include-all --include-seed` で migration と seed を全適用
4. seed をもう一度流して冪等性（`ON CONFLICT`）を確認
5. migration 数 / テーブル数 / 件数のサマリを表示

migration 001〜012 は Supabase 固有の拡張に依存していないため、素の PostgreSQL に
そのまま通る。Docker も本番の認証情報も不要。

本番への適用（`db push --linked`）は CI では行わない。手元から明示的に実行する。

## Docker が必要なコマンド

以下はローカルに Docker が要る。Docker のない環境（Claude Code on the web 等）では使えない。

| コマンド | 用途 |
| --- | --- |
| `supabase start` / `stop` | ローカル Supabase スタック一式 |
| `supabase db reset` | ローカル DB を作り直して migration + seed 再適用 |
| `supabase db diff` | シャドウ DB と比較して migration を自動生成 |
| `supabase db dump` | スキーマ / データのダンプ |
| `supabase gen types --local` / `--db-url` | 型生成（pg-meta コンテナを使う） |

Docker 不要で使えるのは `db push` / `migration list` / `migration repair` / `migration new` /
`gen types --linked`（Management API 経由）など。

## 注意

- **`supabase config push` は実行しない。** `config.toml` の `[auth]` 等の内容で本番設定を上書きしてしまう。
  このプロジェクトはサインアップ無効・ユーザー手動作成の運用なので、事故防止のため
  `config.toml` 側も `enable_signup = false` に揃えてあるが、そもそも push しないこと。
- アクセストークン（`sbp_...`）と DB パスワードは絶対にコミットしない。
- `supabase gen types` による `database.ts` は現状導入していない。型は `src/lib/types/*.ts` に手書きしている。
  導入するなら「生成型は別ファイルに置き、手書き型はそこから導出する」方針を決めてから。
- Claude Code on the web（リモート実行環境）からは `api.supabase.com` への通信が
  プロキシで遮断されているため `login` / `link` / `db push --linked` はできない。
  CLI の実行はローカルマシンから行う。
