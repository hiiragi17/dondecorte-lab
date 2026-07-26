-- ============================================
-- DonDecorte Lab — シードデータ（マスター）
-- ============================================
-- カテゴリ別ファイルを順序通り読み込む。
-- 依存関係に従い、artists → comedy_groups → comedy_group_members → ... の順。
--
-- 実行例:
--   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
--   または supabase db reset 時に自動実行される。
--
-- 各ファイルは ON CONFLICT 句により再実行しても安全（idempotent）。

begin;

\ir seeds/01_artists.sql
\ir seeds/02_comedy_groups.sql
\ir seeds/03_comedy_group_members.sql
\ir seeds/04_achievements.sql
\ir seeds/05_videos.sql
\ir seeds/06_lives.sql
\ir seeds/07_radios.sql
\ir seeds/08_articles.sql
\ir seeds/09_tv_shows.sql
\ir seeds/10_topics.sql
\ir seeds/11_units.sql
\ir seeds/12_cms.sql
\ir seeds/13_magazines.sql
\ir seeds/14_live_schedules.sql

commit;
