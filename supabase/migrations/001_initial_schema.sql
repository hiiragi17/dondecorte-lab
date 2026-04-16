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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table lives is 'ライブ・イベント';

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
