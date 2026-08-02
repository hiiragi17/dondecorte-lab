# SQL Editor で Supabase DB を作り直す手順

Supabase Dashboard の SQL Editor だけで、`public` schema のアプリ用 DB を作り直すための SQL です。

## 実行前の注意

- **破壊的操作です。必ずバックアップ後に実行してください。**
- 対象は `public` schema 配下のアプリ用オブジェクトです。
- `auth.users` や Storage など Supabase 管理 schema のデータは、この手順では初期化しません。
- 既存の `supabase/migrations/` は Supabase CLI 用の履歴として残し、このディレクトリは SQL Editor での再構築用として使います。
- seed はまだ作成途中のため、このディレクトリでは現時点では扱いません。

## 実行順

SQL Editor で以下の順に 1 ファイルずつ実行してください。

1. `00_drop_public.sql`
   - `public` schema を削除して作り直します。
2. `01_schema.sql`
   - `supabase/migrations/*.sql` を番号順に結合した schema を作成します。
   - PR #118 の明示的な `GRANT` 対応も含まれます。

## 更新方法

新しい migration を追加した場合は、`01_schema.sql` を `supabase/migrations/*.sql` の番号順で結合し直してください。

seed は完成後に、SQL Editor で実行できる形へ別途追加します。`supabase/seed.sql` は `psql` 専用の `\ir` を使っているため、そのまま SQL Editor へ貼り付けても動きません。
