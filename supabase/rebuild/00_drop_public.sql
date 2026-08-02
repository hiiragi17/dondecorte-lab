-- ============================================
-- DonDecorte Lab — SQL Editor 用 DB 初期化
-- ============================================
-- Supabase SQL Editor で実行する場合の 1 本目。
-- public schema 配下のアプリ用オブジェクトを全削除してから作り直す。
--
-- 注意:
--   - 破壊的操作です。必ずバックアップ後に実行してください。
--   - auth.users / storage など Supabase 管理 schema のデータは対象外です。
--   - この後に 01_schema.sql を実行してください。

begin;

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres;
grant usage on schema public to anon, authenticated, service_role;

commit;
