-- ============================================
-- 03. comedy_group_members（コンビ構成）
-- ============================================
-- ドンデコルテのメンバー2名を紐付ける。
-- (comedy_group_id, artist_id) の unique 制約があるため
-- ON CONFLICT で再実行しても安全。

insert into comedy_group_members (comedy_group_id, artist_id, role)
values
  (
    '22222222-2222-4222-8222-000000000001',  -- ドンデコルテ
    '11111111-1111-4111-8111-000000000001',  -- 渡辺銀次
    'ボケ'
  ),
  (
    '22222222-2222-4222-8222-000000000001',  -- ドンデコルテ
    '11111111-1111-4111-8111-000000000002',  -- 小橋共作
    'ツッコミ'
  )
on conflict (comedy_group_id, artist_id) do update set
  role = excluded.role;
