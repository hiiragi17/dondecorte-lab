-- unit_members の unique 制約を修正する
--
-- 問題: NULLS NOT DISTINCT を使った unique (unit_id, artist_id) は、
--       コンビメンバー行（artist_id = NULL）が2件以上あると衝突する。
--       例: (unit_id=X, comedy_group_id=A, artist_id=NULL)
--           (unit_id=X, comedy_group_id=B, artist_id=NULL)
--       → (X, NULL) = (X, NULL) と判定されてしまう。
--
-- 修正: NULLS NOT DISTINCT の unique 制約を削除し、
--       NULL を除外した部分インデックスに置き換える。

-- 既存の制約を削除
alter table unit_members
  drop constraint if exists unit_members_unit_id_comedy_group_id_key;

alter table unit_members
  drop constraint if exists unit_members_unit_id_artist_id_key;

-- 部分インデックスで重複防止（NULL 行は一意性チェックから除外）
create unique index if not exists unit_members_unit_comedy_group_unique
  on unit_members (unit_id, comedy_group_id)
  where comedy_group_id is not null;

create unique index if not exists unit_members_unit_artist_unique
  on unit_members (unit_id, artist_id)
  where artist_id is not null;
