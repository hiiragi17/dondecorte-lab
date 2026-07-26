-- ============================================
-- 14. live_schedules（ライブのチケットスケジュール）
-- ============================================
-- 06_lives.sql で登録したライブの「抽選 / 販売」期間を登録する。
-- 実運用では FANY 同期（source = 'fany'）が主な投入経路になるため、
-- ここでは告知で日時が確認できた手動分（source = 'manual'）のみを最小限入れる。
-- 受付期間は FANY の受付公演詳細で確認できた範囲で end_date / ends_at まで入れる。
-- 固定UUID（eeee...）+ ON CONFLICT で再実行安全。

insert into live_schedules (
  id, live_id, phase_type, label, start_date, end_date, starts_at, ends_at, url, sort_order, source
) values
  (
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    '55555555-5555-4555-8555-000000000010',  -- 第十回単独ライブ「とおりこす」
    'lottery',
    '一次先行受付',
    '2026-05-09', '2026-05-12',
    '2026-05-09 20:30:00+09', '2026-05-12 11:00:00+09',
    'https://ticket.fany.lol/event/detail/15970',
    10,
    'manual'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    '55555555-5555-4555-8555-000000000011',  -- なんばグランド花月初単独ライブ「ひとたまりもない」
    'lottery',
    '一次先行受付',
    '2026-05-09', '2026-05-12',
    '2026-05-09 20:30:00+09', '2026-05-12 11:00:00+09',
    null,
    10,
    'manual'
  )
on conflict (id) do update set
  live_id = excluded.live_id,
  phase_type = excluded.phase_type,
  label = excluded.label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  url = excluded.url,
  sort_order = excluded.sort_order,
  source = excluded.source,
  updated_at = now();
