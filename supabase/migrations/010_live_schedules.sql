-- ============================================
-- ライブのチケットスケジュール（抽選期間・販売期間）
-- ============================================
-- Fany などのイベントは「抽選期間」「販売期間」「イベント当日」の 3 つの
-- 日程を持つ。当日（イベント日）は lives.event_date が担うため、ここでは
-- それ以外の「期間（開始〜終了の帯）」を子テーブルとして切り出す。
--
-- 1 つのライブに対して複数の期間を登録できる（例: 一次抽選 / 二次抽選 /
-- 先行販売 / 一般販売）。phase_type で抽選 / 販売を区別し、label に
-- 「一次抽選」等の自由表記を持たせる。
--
-- 参考:
--   - 明示 GRANT 運用: supabase/migrations/008_explicit_grants.sql
--   - 子テーブル + GRANT の例: supabase/migrations/009_cms_and_magazines.sql

create table live_schedules (
  id uuid primary key default gen_random_uuid(),
  live_id uuid not null references lives(id) on delete cascade,
  phase_type text not null
    check (phase_type in ('lottery', 'sale')), -- 抽選 / 販売
  label text,                  -- 自由表記（例: 一次抽選, 先行販売）
  start_date date not null,    -- 期間開始日
  end_date date,               -- 期間終了日（null なら単日）
  start_time timestamptz,      -- 任意の開始時刻（締切時刻など）
  url text,                    -- 申込 / 購入ページのURL
  sort_order integer not null default 0, -- 表示順
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- end_date を指定する場合は start_date 以降であること
  check (end_date is null or end_date >= start_date)
);

comment on table live_schedules is 'ライブのチケットスケジュール（抽選期間・販売期間）';

-- ============================================
-- インデックス
-- ============================================
create index idx_live_schedules_live on live_schedules(live_id);
create index idx_live_schedules_start on live_schedules(start_date);

-- ============================================
-- updated_at 自動更新トリガー（update_updated_at は 001 で定義済み）
-- ============================================
create trigger trg_live_schedules_updated before update on live_schedules
  for each row execute function update_updated_at();

-- ============================================
-- RLS（読み取りは公開、書き込みは認証ユーザーのみ）
-- ============================================
alter table live_schedules enable row level security;

create policy live_schedules_select on live_schedules
  for select to anon, authenticated using (true);
create policy live_schedules_insert on live_schedules
  for insert to authenticated with check (true);
create policy live_schedules_update on live_schedules
  for update to authenticated using (true) with check (true);
create policy live_schedules_delete on live_schedules
  for delete to authenticated using (true);

-- ============================================
-- 明示的な GRANT（008 でデフォルト権限を revoke しているため必須）
-- ============================================
-- 公開読み取り対象: anon は SELECT のみ、authenticated / service_role は CRUD。
-- 主キーは uuid のため sequence 権限は不要。
grant select on public.live_schedules to anon;
grant select, insert, update, delete on public.live_schedules to authenticated;
grant select, insert, update, delete on public.live_schedules to service_role;
