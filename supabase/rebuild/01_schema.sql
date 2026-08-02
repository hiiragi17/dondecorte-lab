-- ============================================
-- DonDecorte Lab — SQL Editor 用 完成形 schema
-- ============================================
-- Supabase SQL Editor で実行する場合の 2 本目。
-- 00_drop_public.sql で public schema を初期化した後、このファイルを実行する。
--
-- このファイルは supabase/migrations/*.sql を番号順に結合したものです。
-- 既存の migration 履歴は残したまま、SQL Editor で貼り付け実行しやすくするための
-- 再構築用 SQL として管理します。
--
-- 実行順:
--   1. supabase/rebuild/00_drop_public.sql
--   2. supabase/rebuild/01_schema.sql

begin;


-- ============================================
-- source: supabase/migrations/001_initial_schema.sql
-- ============================================

-- ============================================
-- 0. 拡張機能
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. 芸人（個人）
-- ============================================
create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kana_name text,
  profile text,
  debut_year integer,
  image_url text,
  -- SNS
  x_url text,
  instagram_url text,
  note_url text,
  youtube_channel_url text,
  tiktok_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table artists is '芸人個人のマスタ';

-- ============================================
-- 2. コンビ/トリオ
-- ============================================
create table comedy_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kana_name text,
  group_type text not null default 'combo'
    check (group_type in ('combo', 'trio', 'quartet', 'other')),
  description text,
  formed_year integer,
  image_url text,
  theme_color text,           -- サイト上での表示色（例: #5C3D2E）
  -- SNS
  x_url text,
  instagram_url text,
  note_url text,
  youtube_channel_url text,
  youtube_channel_id text,    -- API自動取得用
  standfm_url text,
  tiktok_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table comedy_groups is 'コンビ・トリオなど恒常的なグループ';

-- ============================================
-- 3. コンビメンバー
-- ============================================
create table comedy_group_members (
  id uuid primary key default gen_random_uuid(),
  comedy_group_id uuid not null references comedy_groups(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  role text, -- ボケ / ツッコミ など
  created_at timestamptz not null default now(),

  unique (comedy_group_id, artist_id)
);

comment on table comedy_group_members is 'コンビの構成メンバー';

-- ============================================
-- 4. ユニット
-- ============================================
create table units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table units is '複数コンビ/個人が集まったユニット';

-- ============================================
-- 5. ユニットメンバー（コンビ or 個人）
-- ============================================
create table unit_members (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- コンビ単位 or 個人単位のどちらか一方のみ
  check (
    (comedy_group_id is not null and artist_id is null) or
    (comedy_group_id is null and artist_id is not null)
  ),

  -- 重複メンバー防止
  unique nulls not distinct (unit_id, comedy_group_id),
  unique nulls not distinct (unit_id, artist_id)
);

comment on table unit_members is 'ユニットの構成。コンビ単位 or ピン参加';

-- ============================================
-- 6. 受賞歴・実績
-- ============================================
create table achievements (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  title text not null,          -- 例: 'M-1グランプリ 2025'
  result text not null,         -- 例: '準優勝', '準決勝進出', '3回戦敗退'
  year integer not null,
  sort_order integer default 0, -- 表示順（重要な実績を上に）
  created_at timestamptz not null default now(),

  -- 個人 / コンビ / ユニットのいずれか1つ
  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

comment on table achievements is '受賞歴・大会実績（M-1, KOC, R-1 等）';

-- ============================================
-- 7. 動画
-- ============================================
create table videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text,
  youtube_video_id text unique, -- API自動取得のキー
  youtube_channel_id text,      -- チャンネルで絞り込み用
  thumbnail_url text,
  published_at timestamptz,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table videos is 'YouTube動画';

-- ============================================
-- 8. 動画出演
-- ============================================
create table video_casts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

comment on table video_casts is '動画の出演者。ピン/コンビ/ユニットのいずれか';

-- ============================================
-- 9. ライブ
-- ============================================
create table lives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date,
  start_time timestamptz,    -- 開演時間（通知に使う）
  venue text,
  description text,
  url text,                  -- チケットサイト等
  is_notified boolean not null default false, -- 通知済みフラグ
  -- 取得元連携（FANY 等。#97 / #42）。手動作成は source='manual' / external_id=null。
  source text not null default 'manual',  -- 取得元（manual / fany 等）
  external_id text,          -- 取得元での一意 ID（FANY の event_id 等）
  source_url text,           -- 取得元の詳細ページ URL
  notified_new_at timestamptz, -- 新規ライブ発見 push を送った時刻（重複送信防止）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table lives is 'ライブ・イベント';

-- 同一取得元 + 外部 ID の重複を防ぐ。手動作成は external_id null で、Postgres の
-- NULLS DISTINCT（既定）により互いに衝突しない。sync の upsert onConflict と一致させるため
-- 部分 index にはしない（部分 index だと ON CONFLICT 指定にマッチせずエラーになる）。
create unique index uq_lives_source_external on lives (source, external_id);

-- ============================================
-- 10. ライブ出演
-- ============================================
create table live_casts (
  id uuid primary key default gen_random_uuid(),
  live_id uuid not null references lives(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

-- ============================================
-- 11. ラジオ
-- ============================================
create table radios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text,       -- Spotify, YouTube, stand.fm 等
  url text,
  published_at timestamptz,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 12. ラジオ出演
-- ============================================
create table radio_casts (
  id uuid primary key default gen_random_uuid(),
  radio_id uuid not null references radios(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

-- ============================================
-- 13. 記事/インタビュー
-- ============================================
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  source text,          -- 媒体名
  published_at timestamptz,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 14. 記事出演
-- ============================================
create table article_casts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

-- ============================================
-- 15. テレビ番組
-- ============================================
create table tv_shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  network text,          -- 放送局
  air_date date,
  air_time timestamptz,
  description text,
  url text,              -- TVer等のリンク
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 16. テレビ出演
-- ============================================
create table tv_show_casts (
  id uuid primary key default gen_random_uuid(),
  tv_show_id uuid not null references tv_shows(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

-- ============================================
-- 17. トピック（雑多な情報）
-- ============================================
create table topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,               -- Markdown対応
  url text,                   -- 関連URL（X投稿、外部サイト等）
  source text,                -- 情報源（X, ワッハ上方, etc）
  topic_date date,            -- 情報の日付
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table topics is '雑多な情報・トピック（写真撮影会、X投稿、CM情報等）';

-- ============================================
-- 18. トピック出演
-- ============================================
create table topic_casts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  comedy_group_id uuid references comedy_groups(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (
    (artist_id is not null)::int +
    (comedy_group_id is not null)::int +
    (unit_id is not null)::int = 1
  )
);

-- ============================================
-- 19. メモ（ポリモーフィック）
-- ============================================
create table memos (
  id uuid primary key default gen_random_uuid(),
  target_type text not null
    check (target_type in ('video', 'live', 'radio', 'article', 'tv_show', 'topic')),
  target_id uuid not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table memos is '各コンテンツに紐づく個人メモ（ポリモーフィック設計）';

-- ============================================
-- インデックス（検索高速化）
-- ============================================

-- cast系：出演者で検索するためのインデックス
create index idx_video_casts_artist on video_casts(artist_id) where artist_id is not null;
create index idx_video_casts_group on video_casts(comedy_group_id) where comedy_group_id is not null;
create index idx_video_casts_unit on video_casts(unit_id) where unit_id is not null;

create index idx_live_casts_artist on live_casts(artist_id) where artist_id is not null;
create index idx_live_casts_group on live_casts(comedy_group_id) where comedy_group_id is not null;
create index idx_live_casts_unit on live_casts(unit_id) where unit_id is not null;

create index idx_radio_casts_artist on radio_casts(artist_id) where artist_id is not null;
create index idx_radio_casts_group on radio_casts(comedy_group_id) where comedy_group_id is not null;
create index idx_radio_casts_unit on radio_casts(unit_id) where unit_id is not null;

create index idx_article_casts_artist on article_casts(artist_id) where artist_id is not null;
create index idx_article_casts_group on article_casts(comedy_group_id) where comedy_group_id is not null;
create index idx_article_casts_unit on article_casts(unit_id) where unit_id is not null;

create index idx_tv_show_casts_artist on tv_show_casts(artist_id) where artist_id is not null;
create index idx_tv_show_casts_group on tv_show_casts(comedy_group_id) where comedy_group_id is not null;
create index idx_tv_show_casts_unit on tv_show_casts(unit_id) where unit_id is not null;

create index idx_topic_casts_artist on topic_casts(artist_id) where artist_id is not null;
create index idx_topic_casts_group on topic_casts(comedy_group_id) where comedy_group_id is not null;
create index idx_topic_casts_unit on topic_casts(unit_id) where unit_id is not null;

-- 受賞歴：コンビ/芸人で検索
create index idx_achievements_group on achievements(comedy_group_id) where comedy_group_id is not null;
create index idx_achievements_artist on achievements(artist_id) where artist_id is not null;

-- コンテンツ系：日付ソート用
create index idx_videos_published on videos(published_at desc);
create index idx_lives_event_date on lives(event_date desc);
create index idx_radios_published on radios(published_at desc);
create index idx_articles_published on articles(published_at desc);
create index idx_tv_shows_air_date on tv_shows(air_date desc);
create index idx_topics_date on topics(topic_date desc);

-- YouTube自動取得用
create index idx_videos_youtube_channel on videos(youtube_channel_id);

-- cast系：重複出演防止の unique partial index
create unique index idx_video_casts_uniq_artist on video_casts(video_id, artist_id) where artist_id is not null;
create unique index idx_video_casts_uniq_group on video_casts(video_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_video_casts_uniq_unit on video_casts(video_id, unit_id) where unit_id is not null;

create unique index idx_live_casts_uniq_artist on live_casts(live_id, artist_id) where artist_id is not null;
create unique index idx_live_casts_uniq_group on live_casts(live_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_live_casts_uniq_unit on live_casts(live_id, unit_id) where unit_id is not null;

create unique index idx_radio_casts_uniq_artist on radio_casts(radio_id, artist_id) where artist_id is not null;
create unique index idx_radio_casts_uniq_group on radio_casts(radio_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_radio_casts_uniq_unit on radio_casts(radio_id, unit_id) where unit_id is not null;

create unique index idx_article_casts_uniq_artist on article_casts(article_id, artist_id) where artist_id is not null;
create unique index idx_article_casts_uniq_group on article_casts(article_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_article_casts_uniq_unit on article_casts(article_id, unit_id) where unit_id is not null;

create unique index idx_tv_show_casts_uniq_artist on tv_show_casts(tv_show_id, artist_id) where artist_id is not null;
create unique index idx_tv_show_casts_uniq_group on tv_show_casts(tv_show_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_tv_show_casts_uniq_unit on tv_show_casts(tv_show_id, unit_id) where unit_id is not null;

create unique index idx_topic_casts_uniq_artist on topic_casts(topic_id, artist_id) where artist_id is not null;
create unique index idx_topic_casts_uniq_group on topic_casts(topic_id, comedy_group_id) where comedy_group_id is not null;
create unique index idx_topic_casts_uniq_unit on topic_casts(topic_id, unit_id) where unit_id is not null;

-- メモ：対象コンテンツ検索用
create index idx_memos_target on memos(target_type, target_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_artists_updated before update on artists
  for each row execute function update_updated_at();
create trigger trg_comedy_groups_updated before update on comedy_groups
  for each row execute function update_updated_at();
create trigger trg_units_updated before update on units
  for each row execute function update_updated_at();
create trigger trg_videos_updated before update on videos
  for each row execute function update_updated_at();
create trigger trg_lives_updated before update on lives
  for each row execute function update_updated_at();
create trigger trg_radios_updated before update on radios
  for each row execute function update_updated_at();
create trigger trg_articles_updated before update on articles
  for each row execute function update_updated_at();
create trigger trg_tv_shows_updated before update on tv_shows
  for each row execute function update_updated_at();
create trigger trg_topics_updated before update on topics
  for each row execute function update_updated_at();
create trigger trg_memos_updated before update on memos
  for each row execute function update_updated_at();

-- ============================================
-- RLS（Row Level Security）
-- ============================================
-- 公開側：誰でも読める
-- 管理側：認証ユーザーのみ書き込み

-- 全テーブルでRLS有効化
alter table artists enable row level security;
alter table comedy_groups enable row level security;
alter table comedy_group_members enable row level security;
alter table units enable row level security;
alter table unit_members enable row level security;
alter table achievements enable row level security;
alter table videos enable row level security;
alter table video_casts enable row level security;
alter table lives enable row level security;
alter table live_casts enable row level security;
alter table radios enable row level security;
alter table radio_casts enable row level security;
alter table articles enable row level security;
alter table article_casts enable row level security;
alter table tv_shows enable row level security;
alter table tv_show_casts enable row level security;
alter table topics enable row level security;
alter table topic_casts enable row level security;

-- メモは全員が閲覧可、書き込みは認証ユーザーのみ
alter table memos enable row level security;

-- 読み取り：全員OK / 書き込み：認証ユーザーのみ
-- ※ メモ以外の18テーブルに対して同じパターン
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'artists','comedy_groups','comedy_group_members',
      'units','unit_members','achievements',
      'videos','video_casts',
      'lives','live_casts',
      'radios','radio_casts',
      'articles','article_casts',
      'tv_shows','tv_show_casts',
      'topics','topic_casts'
    ])
  loop
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_select', t
    );
    execute format(
      'create policy %I on %I for insert to authenticated with check (true)',
      t || '_insert', t
    );
    execute format(
      'create policy %I on %I for update to authenticated using (true) with check (true)',
      t || '_update', t
    );
    execute format(
      'create policy %I on %I for delete to authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end $$;

-- メモ専用RLS: SELECTは公開、書き込みは認証ユーザーのみ
create policy memos_select on memos for select to anon, authenticated using (true);
create policy memos_insert on memos for insert to authenticated with check (true);
create policy memos_update on memos for update to authenticated using (true) with check (true);
create policy memos_delete on memos for delete to authenticated using (true);


-- ============================================
-- source: supabase/migrations/002_replace_comedy_group_members.sql
-- ============================================

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


-- ============================================
-- source: supabase/migrations/003_fix_unit_members_unique.sql
-- ============================================

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


-- ============================================
-- source: supabase/migrations/004_tags_and_taggings.sql
-- ============================================

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

  -- アプリ側（src/lib/actions/tags.ts）と同じ制約をDBレベルでも担保する
  check (char_length(btrim(name)) between 1 and 50),
  check (name = btrim(name)),
  check (char_length(slug) between 1 and 50),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (
    description is null or (
      description = btrim(description)
      and char_length(description) <= 200
    )
  ),
  check (color is null or color ~* '^#(?:[0-9a-f]{3}|[0-9a-f]{6})$'),

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


-- ============================================
-- source: supabase/migrations/005_unified_casts.sql
-- ============================================

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
-- 5. 親コンテンツの存在チェック（旧 cast テーブルの外部キー相当）
-- ============================================
-- ポリモーフィックなため content 側へ FK を張れない。INSERT / UPDATE 時に
-- content_id が content_type に対応する親テーブルに存在するかをトリガーで
-- 検証し、旧 cast テーブルの外部キー制約と同等の整合性を担保する。
create or replace function validate_cast_content()
returns trigger
language plpgsql
as $$
declare
  content_exists boolean;
begin
  case new.content_type
    when 'video' then
      select exists(select 1 from videos where id = new.content_id) into content_exists;
    when 'live' then
      select exists(select 1 from lives where id = new.content_id) into content_exists;
    when 'radio' then
      select exists(select 1 from radios where id = new.content_id) into content_exists;
    when 'article' then
      select exists(select 1 from articles where id = new.content_id) into content_exists;
    when 'tv_show' then
      select exists(select 1 from tv_shows where id = new.content_id) into content_exists;
    when 'topic' then
      select exists(select 1 from topics where id = new.content_id) into content_exists;
    else
      raise exception 'casts.content_type が不正です: %', new.content_type;
  end case;

  if not content_exists then
    raise exception 'casts.content_id (%) が % テーブルに存在しません',
      new.content_id, new.content_type;
  end if;

  return new;
end;
$$;

comment on function validate_cast_content() is
  'casts の content_id が content_type に対応する親テーブルに存在することを検証する（旧 cast テーブルの外部キー相当）';

create trigger trg_casts_validate_content before insert or update on casts
  for each row execute function validate_cast_content();

-- ============================================
-- 6. RLS（読み取りは公開、書き込みは認証ユーザーのみ）
-- ============================================
alter table casts enable row level security;

create policy casts_select on casts for select to anon, authenticated using (true);
create policy casts_insert on casts for insert to authenticated with check (true);
create policy casts_update on casts for update to authenticated using (true) with check (true);
create policy casts_delete on casts for delete to authenticated using (true);

-- ============================================
-- 7. 旧 cast テーブルを削除
-- ============================================
-- 付随するインデックス・RLS ポリシーも一緒に削除される。
drop table video_casts;
drop table live_casts;
drop table radio_casts;
drop table article_casts;
drop table tv_show_casts;
drop table topic_casts;


-- ============================================
-- source: supabase/migrations/006_upsert_content_with_casts.sql
-- ============================================

-- ============================================
-- コンテンツ + 出演者(casts) のアトミックな upsert
-- ============================================
-- 各コンテンツ(video / live / radio / article / tv_show / topic)の
-- Server Action は、メインレコードの insert/update と casts の置き換え
-- (delete → insert)を別クエリで実行しており非アトミックだった。
-- 片方が失敗するとデータ不整合(出演者なしレコード / 出演者全消去)が
-- 起こりうるため、両者を 1 つの関数 = 1 トランザクションにまとめる。
--
-- casts は #47 で単一テーブルに統合済みのため、6 コンテンツを
-- 1 つの汎用関数で扱える。

create or replace function upsert_content_with_casts(
  p_content_type text,
  p_content_id   uuid,   -- null の場合は INSERT、指定時は UPDATE
  p_content      jsonb,  -- メインレコードのカラム(キー名 = カラム名)
  p_casts        jsonb   -- [{ "type": "artist|comedy_group|unit", "id": "<uuid>" }, ...]
)
returns uuid
language plpgsql
as $$
declare
  v_table text;
  v_id    uuid;
  v_cols  text;
  v_set   text;
  v_count int;
begin
  -- content_type をホワイトリスト検証してテーブル名に解決する
  v_table := case p_content_type
    when 'video'   then 'videos'
    when 'live'    then 'lives'
    when 'radio'   then 'radios'
    when 'article' then 'articles'
    when 'tv_show' then 'tv_shows'
    when 'topic'   then 'topics'
  end;
  if v_table is null then
    raise exception 'content_type が不正です: %', p_content_type;
  end if;

  -- 対象カラム一覧(jsonb のキー = カラム名)
  select string_agg(quote_ident(key), ', ')
    into v_cols
    from jsonb_object_keys(p_content) as key;
  if v_cols is null then
    raise exception 'content が空です';
  end if;

  if p_content_id is null then
    -- INSERT: p_content に含まれるカラムのみ指定し、残りは既定値に任せる
    execute format(
      'insert into %I (%s) select %s from jsonb_populate_record(null::%I, $1) returning id',
      v_table, v_cols, v_cols, v_table
    )
    using p_content
    into v_id;
  else
    -- UPDATE: updated_at は常に現在時刻で更新する
    v_id := p_content_id;
    select string_agg(format('%I = r.%I', key, key), ', ')
      into v_set
      from jsonb_object_keys(p_content) as key;
    execute format(
      'update %I as t set %s, updated_at = now() '
      'from jsonb_populate_record(null::%I, $1) as r where t.id = $2',
      v_table, v_set, v_table
    )
    using p_content, v_id;

    get diagnostics v_count = row_count;
    if v_count <> 1 then
      raise exception '指定されたコンテンツが見つかりません'
        using errcode = 'no_data_found';
    end if;
  end if;

  -- casts の置き換え(delete → insert)を同一トランザクション内で実行する
  delete from casts
   where content_type = p_content_type
     and content_id = v_id;

  insert into casts (content_type, content_id, artist_id, comedy_group_id, unit_id)
  select
    p_content_type,
    v_id,
    case when c->>'type' = 'artist'       then (c->>'id')::uuid end,
    case when c->>'type' = 'comedy_group' then (c->>'id')::uuid end,
    case when c->>'type' = 'unit'         then (c->>'id')::uuid end
  from jsonb_array_elements(coalesce(p_casts, '[]'::jsonb)) as c;

  return v_id;
end;
$$;

comment on function upsert_content_with_casts(text, uuid, jsonb, jsonb) is
  'コンテンツのメインレコード upsert と casts の置き換えを 1 トランザクションで実行する(#64)';

-- 書き込みは認証ユーザーのみ。anon からの実行は禁止する。
revoke execute on function upsert_content_with_casts(text, uuid, jsonb, jsonb) from public;
grant execute on function upsert_content_with_casts(text, uuid, jsonb, jsonb) to authenticated;


-- ============================================
-- source: supabase/migrations/007_push_subscriptions.sql
-- ============================================

-- ============================================
-- Web Push 購読端末（push_subscriptions）
-- ============================================
-- Web Push（VAPID）でスマホ等にプッシュ通知を送るための購読情報を保持する。
-- 後続の Fany 連携（先行抽選通知）や YouTube 新着通知などで使い回す。
--
-- 自分専用アプリだが家族・友人にも配れるよう user_id への紐付けは省略する。
-- 1 端末 = 1 行（複数端末で複数 subscription が並ぶ想定）。

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table push_subscriptions is
  'Web Push（VAPID）の購読端末。endpoint / p256dh / auth は機微情報のため anon には読ませない';

-- ============================================
-- RLS
-- ============================================
-- insert: anon 可（誰でも自分の端末を購読登録できる）
-- select / delete / update: ポリシー無し → anon / authenticated からは不可。
--   購読一覧の取得・GC（404/410 の削除）はサーバ側（Route Handler / Server Action）から
--   service_role キーで実行する（service_role は RLS をバイパスする）。
alter table push_subscriptions enable row level security;

create policy push_subscriptions_insert
  on push_subscriptions for insert to anon, authenticated with check (true);


-- ============================================
-- source: supabase/migrations/008_explicit_grants.sql
-- ============================================

-- ============================================
-- public スキーマ全テーブルへの明示的な GRANT
-- ============================================
-- Supabase は 2026-05-30 以降の新規プロジェクトで、`public` スキーマの
-- テーブルをデフォルトでは Data API（PostgREST / GraphQL / supabase-js）に
-- 公開しなくなる。既存プロジェクトも 2026-10-30 以降は同じ挙動に切り替わる。
-- 参考: https://github.com/orgs/supabase/discussions/45329
--
-- 既存の migration 001 / 004 / 005 / 007 は RLS ポリシーのみで、SQL レベルの
-- GRANT を Supabase のデフォルト権限に依存していた。新挙動下では RLS の前に
-- GRANT が無いと PostgREST が「permission denied」で弾くため、ここで明示的に
-- 付与する。同時に将来のテーブルでもデフォルト GRANT に依存しないよう、
-- alter default privileges で revoke しておく（個別 migration で都度 grant する運用に変える）。

-- ============================================
-- 1. 公開読み取り対象テーブル（anon: SELECT / authenticated, service_role: CRUD）
-- ============================================
-- メモ含む 16 テーブル。書き込みは RLS で `authenticated` のみに絞られる。
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'artists','comedy_groups','comedy_group_members',
      'units','unit_members','achievements',
      'videos','lives','radios','articles','tv_shows','topics',
      'casts','memos','tags','taggings'
    ])
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;

-- ============================================
-- 2. push_subscriptions（機微情報のため anon は INSERT のみ）
-- ============================================
-- endpoint / p256dh / auth が anon に読めると第三者が任意送信できてしまうため、
-- RLS でも anon の SELECT を許可していない。GRANT も合わせる。
-- 読み取り・削除はサーバ側で service_role から実行する。
grant insert on public.push_subscriptions to anon;
grant select, insert, update, delete on public.push_subscriptions to service_role;

-- ============================================
-- 3. RPC 関数への EXECUTE 権限
-- ============================================
-- migration 006 の upsert_content_with_casts は既に grant 済み。
-- migration 002 の replace_comedy_group_members は未付与だったため明示する。
grant execute on function public.replace_comedy_group_members(uuid, jsonb) to authenticated;

-- ============================================
-- 4. 将来のテーブル：デフォルト GRANT を切る
-- ============================================
-- 以降 `create table` した直後に明示的に `grant ... to anon/authenticated/service_role` を
-- 書く運用に統一する（CLAUDE.md / docs/design.md にルール記載）。
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;


-- ============================================
-- source: supabase/migrations/009_cms_and_magazines.sql
-- ============================================

-- ============================================
-- CM・雑誌の専用コンテンツテーブル追加
-- ============================================
-- これまで CM 情報は topics に、雑誌は articles の source に間借りしていたが、
-- 性質（CM=映像/放送、雑誌=紙媒体/号数）が異なるため独立した content_type として
-- 切り出す。video / live / radio / article / tv_show / topic と同じく
-- casts（ポリモーフィック出演者）・memos・upsert_content_with_casts の対象に加える。
--
-- 参考:
--   - casts 統合: supabase/migrations/005_unified_casts.sql
--   - 汎用 upsert: supabase/migrations/006_upsert_content_with_casts.sql
--   - 明示 GRANT 運用: supabase/migrations/008_explicit_grants.sql

-- ============================================
-- 1. CM
-- ============================================
create table cms (
  id uuid primary key default gen_random_uuid(),
  title text not null,        -- CM・案件のタイトル
  advertiser text,            -- 企業・ブランド名
  product text,               -- 商品・サービス名
  url text,                   -- CM動画・紹介ページ等のURL
  aired_on date,              -- 放送・公開日（ソート用の主たる日付）
  description text,           -- 内容メモ（Markdown対応）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cms is 'CM・広告案件';

-- ============================================
-- 2. 雑誌
-- ============================================
create table magazines (
  id uuid primary key default gen_random_uuid(),
  title text not null,        -- 掲載内容・特集のタイトル
  magazine_name text,         -- 誌名
  issue text,                 -- 号数（例: 2026年7月号）
  publisher text,             -- 出版社
  url text,                   -- 販売・紹介ページのURL
  published_on date,          -- 発売日（ソート用の主たる日付）
  description text,           -- 内容メモ（Markdown対応）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table magazines is '雑誌掲載';

-- ============================================
-- 3. インデックス（日付ソート用）
-- ============================================
create index idx_cms_aired_on on cms(aired_on desc);
create index idx_magazines_published_on on magazines(published_on desc);

-- ============================================
-- 4. updated_at 自動更新トリガー
-- ============================================
-- update_updated_at() は migration 001 で定義済み。
create trigger trg_cms_updated before update on cms
  for each row execute function update_updated_at();
create trigger trg_magazines_updated before update on magazines
  for each row execute function update_updated_at();

-- ============================================
-- 5. casts の content_type を cm / magazine に拡張
-- ============================================
alter table casts drop constraint casts_content_type_check;
alter table casts add constraint casts_content_type_check
  check (content_type in (
    'video', 'live', 'radio', 'article', 'tv_show', 'topic', 'cm', 'magazine'
  ));

-- 親コンテンツ削除時に対応する casts 行を掃除する（005 の関数を再利用）。
create trigger trg_cms_delete_casts before delete on cms
  for each row execute function delete_casts_on_content_delete('cm');
create trigger trg_magazines_delete_casts before delete on magazines
  for each row execute function delete_casts_on_content_delete('magazine');

-- casts の親存在チェック関数に cm / magazine を追加する（005 の validate_cast_content）。
create or replace function validate_cast_content()
returns trigger
language plpgsql
as $$
declare
  content_exists boolean;
begin
  case new.content_type
    when 'video' then
      select exists(select 1 from videos where id = new.content_id) into content_exists;
    when 'live' then
      select exists(select 1 from lives where id = new.content_id) into content_exists;
    when 'radio' then
      select exists(select 1 from radios where id = new.content_id) into content_exists;
    when 'article' then
      select exists(select 1 from articles where id = new.content_id) into content_exists;
    when 'tv_show' then
      select exists(select 1 from tv_shows where id = new.content_id) into content_exists;
    when 'topic' then
      select exists(select 1 from topics where id = new.content_id) into content_exists;
    when 'cm' then
      select exists(select 1 from cms where id = new.content_id) into content_exists;
    when 'magazine' then
      select exists(select 1 from magazines where id = new.content_id) into content_exists;
    else
      raise exception 'casts.content_type が不正です: %', new.content_type;
  end case;

  if not content_exists then
    raise exception 'casts.content_id (%) が % テーブルに存在しません',
      new.content_id, new.content_type;
  end if;

  return new;
end;
$$;

-- ============================================
-- 6. memos の target_type を cm / magazine に拡張
-- ============================================
alter table memos drop constraint memos_target_type_check;
alter table memos add constraint memos_target_type_check
  check (target_type in (
    'video', 'live', 'radio', 'article', 'tv_show', 'topic', 'cm', 'magazine'
  ));

-- ============================================
-- 7. upsert_content_with_casts の content_type→テーブル解決に cm / magazine を追加
-- ============================================
create or replace function upsert_content_with_casts(
  p_content_type text,
  p_content_id   uuid,
  p_content      jsonb,
  p_casts        jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_table text;
  v_id    uuid;
  v_cols  text;
  v_set   text;
  v_count int;
begin
  v_table := case p_content_type
    when 'video'    then 'videos'
    when 'live'     then 'lives'
    when 'radio'    then 'radios'
    when 'article'  then 'articles'
    when 'tv_show'  then 'tv_shows'
    when 'topic'    then 'topics'
    when 'cm'       then 'cms'
    when 'magazine' then 'magazines'
  end;
  if v_table is null then
    raise exception 'content_type が不正です: %', p_content_type;
  end if;

  select string_agg(quote_ident(key), ', ')
    into v_cols
    from jsonb_object_keys(p_content) as key;
  if v_cols is null then
    raise exception 'content が空です';
  end if;

  if p_content_id is null then
    execute format(
      'insert into %I (%s) select %s from jsonb_populate_record(null::%I, $1) returning id',
      v_table, v_cols, v_cols, v_table
    )
    using p_content
    into v_id;
  else
    v_id := p_content_id;
    select string_agg(format('%I = r.%I', key, key), ', ')
      into v_set
      from jsonb_object_keys(p_content) as key;
    execute format(
      'update %I as t set %s, updated_at = now() '
      'from jsonb_populate_record(null::%I, $1) as r where t.id = $2',
      v_table, v_set, v_table
    )
    using p_content, v_id;

    get diagnostics v_count = row_count;
    if v_count <> 1 then
      raise exception '指定されたコンテンツが見つかりません'
        using errcode = 'no_data_found';
    end if;
  end if;

  delete from casts
   where content_type = p_content_type
     and content_id = v_id;

  insert into casts (content_type, content_id, artist_id, comedy_group_id, unit_id)
  select
    p_content_type,
    v_id,
    case when c->>'type' = 'artist'       then (c->>'id')::uuid end,
    case when c->>'type' = 'comedy_group' then (c->>'id')::uuid end,
    case when c->>'type' = 'unit'         then (c->>'id')::uuid end
  from jsonb_array_elements(coalesce(p_casts, '[]'::jsonb)) as c;

  return v_id;
end;
$$;

-- ============================================
-- 8. RLS（読み取りは公開、書き込みは認証ユーザーのみ）
-- ============================================
alter table cms enable row level security;
alter table magazines enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['cms', 'magazines'])
  loop
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_select', t
    );
    execute format(
      'create policy %I on %I for insert to authenticated with check (true)',
      t || '_insert', t
    );
    execute format(
      'create policy %I on %I for update to authenticated using (true) with check (true)',
      t || '_update', t
    );
    execute format(
      'create policy %I on %I for delete to authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end $$;

-- ============================================
-- 9. 明示的な GRANT（008 でデフォルト権限を revoke しているため必須）
-- ============================================
-- 公開読み取り対象: anon は SELECT のみ、authenticated / service_role は CRUD。
-- 主キーは uuid のため sequence 権限は不要。
do $$
declare
  t text;
begin
  for t in select unnest(array['cms', 'magazines'])
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;


-- ============================================
-- source: supabase/migrations/010_live_schedules.sql
-- ============================================

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
  start_date date not null,    -- 期間開始日（帯表示・カレンダー用）
  end_date date,               -- 期間終了日（null なら単日。帯表示・カレンダー用）
  -- 受付の「何時開始 / 何時締切」を保持する時刻付き列（FANY 取得分。#97 / #42）。
  -- start_date / end_date は帯表示用に併存させ、手動入力分は starts_at / ends_at = null。
  starts_at timestamptz,       -- 受付開始日時（時刻あり）
  ends_at timestamptz,         -- 受付締切日時（時刻あり）
  url text,                    -- 申込 / 購入ページのURL
  sort_order integer not null default 0, -- 表示順
  -- 取得元連携（FANY 等）。手動作成は source='manual' / external_id=null。
  source text not null default 'manual', -- 取得元（manual / fany 等）
  external_id text,            -- 取得元での一意 ID（FANY の reception_id 等）
  notified_new_at timestamptz, -- 先行受付 発見 push を送った時刻（重複送信防止）
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

-- 同一取得元 + 外部 ID の重複を防ぐ。手動作成は external_id null（NULLS DISTINCT で衝突しない）。
-- sync の upsert onConflict と一致させるため部分 index にはしない。
create unique index uq_live_schedules_source_external
  on live_schedules (source, external_id);

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


-- ============================================
-- source: supabase/migrations/011_video_review.sql
-- ============================================

-- ============================================
-- 動画レビュー機能（自動取得動画の承認 / 却下）
-- ============================================
-- YouTube 自動取得（/api/cron/youtube）で取り込んだ動画を、管理画面で
-- 承認してから公開側に表示できるようにするためのカラムを videos に追加する。
--
--   - source:        取り込み元（manual = 手動登録 / youtube_auto = 自動取得）
--   - review_status: レビュー状態（pending = 承認待ち / approved = 承認済み /
--                    rejected = 却下）
--
-- 既存行・手動登録はデフォルトで manual / approved になるため挙動は変わらない。
-- 却下した動画は行を残すことで、youtube_video_id の UNIQUE 制約により
-- 次回同期での再取り込みをブロックする。
--
-- 参考:
--   - 明示 GRANT 運用: supabase/migrations/008_explicit_grants.sql
--     （カラム追加はテーブル単位の既存 GRANT でカバーされるため追加不要）

alter table videos
  add column source text not null default 'manual'
    check (source in ('manual', 'youtube_auto')),
  add column review_status text not null default 'approved'
    check (review_status in ('pending', 'approved', 'rejected'));

comment on column videos.source is '取り込み元（manual = 手動登録 / youtube_auto = YouTube自動取得）';
comment on column videos.review_status is 'レビュー状態（pending = 承認待ち / approved = 承認済み / rejected = 却下）';

-- レビュー待ち・却下の絞り込み用（大半が approved になるため部分インデックス）
create index idx_videos_review_status on videos(review_status)
  where review_status <> 'approved';

-- ============================================
-- RLS: anon には承認済みのみ公開する
-- ============================================
-- 公開側クエリでも review_status = 'approved' で絞り込むが、Data API を
-- 直接叩かれても承認前・却下済みの動画が見えないよう RLS でも防御する。
-- authenticated（管理画面）は従来どおり全件参照できる。
drop policy videos_select on videos;
create policy videos_select_anon on videos
  for select to anon using (review_status = 'approved');
create policy videos_select_authenticated on videos
  for select to authenticated using (true);


-- ============================================
-- source: supabase/migrations/012_fany_columns_forward.sql
-- ============================================

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

commit;
