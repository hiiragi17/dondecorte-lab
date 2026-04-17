-- ============================================
-- comedy_group_members の原子的な差し替え RPC
-- ============================================
-- 管理画面でコンビのメンバーを編集する際、
-- 既存メンバーを全削除してから新しいメンバーを挿入する処理を
-- 単一トランザクション内で実行する。
-- 途中で失敗した場合はロールバックされるため、
-- 「削除だけ成功してメンバーが消失する」事故を防ぐ。

create or replace function replace_comedy_group_members(
  p_comedy_group_id uuid,
  p_members jsonb
)
returns void
language plpgsql
security invoker
as $$
begin
  delete from comedy_group_members
  where comedy_group_id = p_comedy_group_id;

  if p_members is null or jsonb_array_length(p_members) = 0 then
    return;
  end if;

  insert into comedy_group_members (comedy_group_id, artist_id, role)
  select
    p_comedy_group_id,
    (m ->> 'artist_id')::uuid,
    nullif(m ->> 'role', '')
  from jsonb_array_elements(p_members) as m;
end;
$$;

comment on function replace_comedy_group_members(uuid, jsonb) is
  'コンビのメンバーを原子的に差し替える（delete + insert をトランザクション内で実行）';
