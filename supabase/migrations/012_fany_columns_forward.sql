-- ============================================
-- FANY 連携カラムの前方 migration（既存 DB 向け）
-- ============================================
-- 001 / 010 の基底 create table には FANY 連携カラム（lives: source / external_id /
-- source_url / notified_new_at、live_schedules: source / external_id / notified_new_at /
-- starts_at / ends_at）と unique index を統合済み。
--
-- ただし基底 migration の編集は「これから作成しなおす DB」にしか効かず、既に 001〜011 を
-- 適用済みの環境にはカラムが追加されない。そうした環境では FANY cron の upsert
-- （onConflict: source,external_id）が即エラーになるため、本 migration で既存テーブルにも
-- 同じカラム・unique index を冪等に追加する。
-- 新規作成 DB では基底で作成済みのため、if not exists で全てスキップされる。
--
-- 参考: supabase/migrations/008_explicit_grants.sql（明示 GRANT 運用）

-- --- lives -----------------------------------------------------------------
alter table lives
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text,
  add column if not exists source_url text,
  add column if not exists notified_new_at timestamptz;

create unique index if not exists uq_lives_source_external
  on lives (source, external_id);

-- --- live_schedules --------------------------------------------------------
alter table live_schedules
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text,
  add column if not exists notified_new_at timestamptz,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

create unique index if not exists uq_live_schedules_source_external
  on live_schedules (source, external_id);

-- --- GRANT -----------------------------------------------------------------
-- 追加カラムは既存テーブルの GRANT を継承するため新規 GRANT は不要
-- （lives は 008、live_schedules は 010 で付与済み）。
