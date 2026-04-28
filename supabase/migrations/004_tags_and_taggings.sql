-- ============================================
-- タグ機能（tags + taggings）
-- ============================================
-- 各コンテンツ（video/live/radio/article/tv_show/topic）を
-- 横断的に分類するためのタグ機構。
-- taggings は memos と同じくポリモーフィック設計（target_type + target_id）。

-- ============================================
-- 1. tags
-- ============================================
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,                          -- URL用の一意なスラッグ
  description text,
  color text,                                  -- 表示色（例: #6BB8D4）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (name),
  unique (slug)
);

comment on table tags is 'コンテンツ横断のタグマスタ';

-- ============================================
-- 2. taggings（ポリモーフィック）
-- ============================================
create table taggings (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tags(id) on delete cascade,
  target_type text not null
    check (target_type in ('video', 'live', 'radio', 'article', 'tv_show', 'topic')),
  target_id uuid not null,
  created_at timestamptz not null default now(),

  unique (tag_id, target_type, target_id)
);

comment on table taggings is 'タグと各コンテンツの紐付け（ポリモーフィック設計）';

-- ============================================
-- インデックス
-- ============================================
create index idx_taggings_target on taggings(target_type, target_id);
create index idx_taggings_tag on taggings(tag_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================
create trigger trg_tags_updated before update on tags
  for each row execute function update_updated_at();

-- ============================================
-- RLS
-- ============================================
alter table tags enable row level security;
alter table taggings enable row level security;

create policy tags_select on tags for select to anon, authenticated using (true);
create policy tags_insert on tags for insert to authenticated with check (true);
create policy tags_update on tags for update to authenticated using (true) with check (true);
create policy tags_delete on tags for delete to authenticated using (true);

create policy taggings_select on taggings for select to anon, authenticated using (true);
create policy taggings_insert on taggings for insert to authenticated with check (true);
create policy taggings_update on taggings for update to authenticated using (true) with check (true);
create policy taggings_delete on taggings for delete to authenticated using (true);
