-- ============================================
-- 11. units（ユニット）+ unit_members
-- ============================================
-- ドンデコルテが参加する漫才ユニットを登録する。
-- units は「複数コンビ / 個人の集合」。メンバーは comedy_groups（02）に登録済みの
-- コンビを unit_members で紐付ける（コンビ単位 or 個人単位のどちらか一方）。
-- 固定UUID（bbbb...）+ ON CONFLICT で再実行安全。

insert into units (id, name, description) values
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
    '男坂',
    'ドンデコルテ・素敵じゃないか・ミカボ・おふろの漫才師4組による漫才ユニット。渋谷よしもと漫才劇場で開催。'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-000000000002',
    '漫才ユニットライブ ～カルテット',
    'ビスケットブラザーズ・滝音・ドンデコルテ・9番街レトロの漫才4組による漫才ユニットライブ。'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

-- 構成メンバー（全てコンビ単位で紐付け）
-- unit_members は unique nulls not distinct (unit_id, comedy_group_id) のため
-- ON CONFLICT で再実行安全。
insert into unit_members (unit_id, comedy_group_id) values
  -- 男坂
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001', '22222222-2222-4222-8222-000000000001'),  -- ドンデコルテ
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001', '22222222-2222-4222-8222-000000000004'),  -- 素敵じゃないか
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001', '22222222-2222-4222-8222-000000000005'),  -- ミカボ
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001', '22222222-2222-4222-8222-000000000006'),  -- おふろ
  -- カルテット
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000002', '22222222-2222-4222-8222-000000000007'),  -- ビスケットブラザーズ
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000002', '22222222-2222-4222-8222-000000000008'),  -- 滝音
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000002', '22222222-2222-4222-8222-000000000001'),  -- ドンデコルテ
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000002', '22222222-2222-4222-8222-000000000009')   -- 9番街レトロ
on conflict (unit_id, comedy_group_id) do nothing;
