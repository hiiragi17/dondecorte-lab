-- ============================================
-- public スキーマ全テーブルへの明示的な GRANT
-- ============================================
-- Supabase は 2026-05-30 以降の新規プロジェクトで、`public` スキーマの
-- テーブルをデフォルトでは Data API（PostgREST / GraphQL / supabase-js）に
-- 公開しなくなる。既存プロジェクトも 2026-10-30 以降は同じ挙動に切り替わる。
-- 参考: https://github.com/orgs/supabase/discussions/45329
--
-- 既存の migration 001 / 004 / 005 / 007 は RLS ポリシーのみで、SQL レベルの
-- GRANT を Supabase のデフォルト権限に依存していた。新挙動下では RLS の前に
-- GRANT が無いと PostgREST が「permission denied」で弾くため、ここで明示的に
-- 付与する。同時に将来のテーブルでもデフォルト GRANT に依存しないよう、
-- alter default privileges で revoke しておく（個別 migration で都度 grant する運用に変える）。

-- ============================================
-- 1. 公開読み取り対象テーブル（anon: SELECT / authenticated, service_role: CRUD）
-- ============================================
-- メモ含む 16 テーブル。書き込みは RLS で `authenticated` のみに絞られる。
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'artists','comedy_groups','comedy_group_members',
      'units','unit_members','achievements',
      'videos','lives','radios','articles','tv_shows','topics',
      'casts','memos','tags','taggings'
    ])
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;

-- ============================================
-- 2. push_subscriptions（機微情報のため anon は INSERT のみ）
-- ============================================
-- endpoint / p256dh / auth が anon に読めると第三者が任意送信できてしまうため、
-- RLS でも anon の SELECT を許可していない。GRANT も合わせる。
-- 読み取り・削除はサーバ側で service_role から実行する。
grant insert on public.push_subscriptions to anon;
grant select, insert, update, delete on public.push_subscriptions to service_role;

-- ============================================
-- 3. RPC 関数への EXECUTE 権限
-- ============================================
-- migration 006 の upsert_content_with_casts は既に grant 済み。
-- migration 002 の replace_comedy_group_members は未付与だったため明示する。
grant execute on function public.replace_comedy_group_members(uuid, jsonb) to authenticated;

-- ============================================
-- 4. 将来のテーブル：デフォルト GRANT を切る
-- ============================================
-- 以降 `create table` した直後に明示的に `grant ... to anon/authenticated/service_role` を
-- 書く運用に統一する（CLAUDE.md / docs/design.md にルール記載）。
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
