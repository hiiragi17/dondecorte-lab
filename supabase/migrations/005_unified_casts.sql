-- ============================================
-- cast テーブルの統合（casts）
-- ============================================
-- video_casts / live_casts / radio_casts / article_casts /
-- tv_show_casts / topic_casts の 6 テーブルを、memos / taggings と同じ
-- ポリモーフィック設計（content_type + content_id）の単一 casts テーブルに統合する。
--
-- 目的:
--   - 共演分析（co-appearances / co-appearance-graph / rankings）で
--     6 テーブルを UNION する必要をなくす
--   - cast 関連ロジックを 1 テーブルに集約する
--
-- 親コンテンツ削除時の cascade は、旧 cast テーブルの
-- `on delete cascade` 相当をトリガーで再現する（ポリモーフィックなため FK は張れない）。

-- ============================================
-- 1. casts テーブル
-- ============================================
create table casts (
  id uuid primary key default gen_random_uuid(),
  content_type text not null
    check (content_type in ('video', 'live', 'radio', 'article', 'tv_show', 'topic')),
  content_id uuid not null,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- ピン/コンビ/ユニットのいずれか1つだけ
  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

comment on table casts is
  '全コンテンツ共通の出演者テーブル（ポリモーフィック設計）。ピン/コンビ/ユニットのいずれか';

-- ============================================
-- 2. 既存データの移行
-- ============================================
-- 旧 cast テーブルの id をそのまま引き継ぐ（gen_random_uuid のため衝突しない）。
insert into casts (id, content_type, content_id, artist_id, comedy_group_id, unit_id, created_at)
select id, 'video',   video_id,    artist_id, comedy_group_id, unit_id, created_at from video_casts
union all
select id, 'live',    live_id,     artist_id, comedy_group_id, unit_id, created_at from live_casts
union all
select id, 'radio',   radio_id,    artist_id, comedy_group_id, unit_id, created_at from radio_casts
union all
select id, 'article', article_id,  artist_id, comedy_group_id, unit_id, created_at from article_casts
union all
select id, 'tv_show', tv_show_id,  artist_id, comedy_group_id, unit_id, created_at from tv_show_casts
union all
select id, 'topic',   topic_id,    artist_id, comedy_group_id, unit_id, created_at from topic_casts;

-- ============================================
-- 3. インデックス
-- ============================================
-- コンテンツから出演者を引く
create index idx_casts_content on casts(content_type, content_id);

-- 出演者からコンテンツを引く
create index idx_casts_artist on casts(artist_id) where artist_id is not null;
create index idx_casts_group on casts(comedy_group_id) where comedy_group_id is not null;
create index idx_casts_unit on casts(unit_id) where unit_id is not null;

-- 重複出演防止（旧テーブルの unique partial index 相当）
create unique index idx_casts_uniq_artist
  on casts(content_type, content_id, artist_id) where artist_id is not null;
create unique index idx_casts_uniq_group
  on casts(content_type, content_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_casts_uniq_unit
  on casts(content_type, content_id, unit_id) where unit_id is not null;

-- ============================================
-- 4. 親コンテンツ削除時の cascade（旧 on delete cascade 相当）
-- ============================================
-- casts は content 側へ FK を張れないため、各コンテンツの DELETE トリガーで掃除する。
create or replace function delete_casts_on_content_delete()
returns trigger
language plpgsql
as $$
begin
  delete from casts
  where content_type = tg_argv[0]
    and content_id = old.id;
  return old;
end;
$$;

comment on function delete_casts_on_content_delete() is
  '親コンテンツ削除時に対応する casts 行を削除する（旧 cast テーブルの on delete cascade 相当）';

create trigger trg_videos_delete_casts before delete on videos
  for each row execute function delete_casts_on_content_delete('video');
create trigger trg_lives_delete_casts before delete on lives
  for each row execute function delete_casts_on_content_delete('live');
create trigger trg_radios_delete_casts before delete on radios
  for each row execute function delete_casts_on_content_delete('radio');
create trigger trg_articles_delete_casts before delete on articles
  for each row execute function delete_casts_on_content_delete('article');
create trigger trg_tv_shows_delete_casts before delete on tv_shows
  for each row execute function delete_casts_on_content_delete('tv_show');
create trigger trg_topics_delete_casts before delete on topics
  for each row execute function delete_casts_on_content_delete('topic');

-- ============================================
-- 5. RLS（読み取りは公開、書き込みは認証ユーザーのみ）
-- ============================================
alter table casts enable row level security;

create policy casts_select on casts for select to anon, authenticated using (true);
create policy casts_insert on casts for insert to authenticated with check (true);
create policy casts_update on casts for update to authenticated using (true) with check (true);
create policy casts_delete on casts for delete to authenticated using (true);

-- ============================================
-- 6. 旧 cast テーブルを削除
-- ============================================
-- 付随するインデックス・RLS ポリシーも一緒に削除される。
drop table video_casts;
drop table live_casts;
drop table radio_casts;
drop table article_casts;
drop table tv_show_casts;
drop table topic_casts;
