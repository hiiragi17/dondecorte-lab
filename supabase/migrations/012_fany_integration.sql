-- ============================================
-- FANY 連携（#97 / #42）用のカラム追加
-- ============================================
-- ticket.fany.lol から取得したライブ / 受付を既存の lives / live_schedules に
-- upsert するため、取得元・外部 ID・発見 push 重複防止のカラムを追加する。
--
-- 時刻方針: live_schedules は帯表示・カレンダー用に既存の start_date / end_date
--   （date 粒度）を残しつつ、受付の「何時開始 / 何時締切」を保持するため
--   starts_at / ends_at（timestamptz）を追加する。FANY 行は両方を埋める。
--   手動入力分は従来どおり date のみ（starts_at / ends_at は null）。
--
-- 参考: supabase/migrations/008_explicit_grants.sql（明示 GRANT 運用）
--       supabase/migrations/010_live_schedules.sql

-- --- lives -----------------------------------------------------------------
alter table lives
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text,
  add column if not exists source_url text,
  add column if not exists notified_new_at timestamptz;

comment on column lives.source is '取得元（manual / fany 等）';
comment on column lives.external_id is '取得元での一意 ID（FANY の event_id 等）。手動作成は null';
comment on column lives.source_url is '取得元の詳細ページ URL';
comment on column lives.notified_new_at is '新規ライブ発見 push を送った時刻（重複送信防止）';

-- 同一取得元 + 外部 ID の重複を防ぐ。手動作成は external_id null で、Postgres の
-- NULLS DISTINCT（既定）により互いに衝突しない。sync の upsert onConflict と一致させるため
-- 部分 index にはしない（部分 index だと ON CONFLICT 指定にマッチせずエラーになる）。
create unique index if not exists uq_lives_source_external
  on lives (source, external_id);

-- --- live_schedules --------------------------------------------------------
alter table live_schedules
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text,
  add column if not exists notified_new_at timestamptz,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

comment on column live_schedules.source is '取得元（manual / fany 等）';
comment on column live_schedules.external_id is '取得元での一意 ID（FANY の reception_id 等）。手動作成は null';
comment on column live_schedules.notified_new_at is '先行受付 発見 push を送った時刻（重複送信防止）';
comment on column live_schedules.starts_at is '受付開始日時（時刻あり）。start_date は帯表示用に併存';
comment on column live_schedules.ends_at is '受付締切日時（時刻あり）。end_date は帯表示用に併存';

create unique index if not exists uq_live_schedules_source_external
  on live_schedules (source, external_id);

-- --- GRANT -----------------------------------------------------------------
-- 追加カラムは既存テーブルの GRANT を継承するため新規 GRANT は不要
-- （lives は 008、live_schedules は 010 で付与済み）。
