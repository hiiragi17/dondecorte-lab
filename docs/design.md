# DonDecorte Lab 設計書

## 概念モデル

```
芸人（個人）──┬── コンビ/トリオ ──┬── ユニット
              │                    │
              └────────────────────┘
                      │
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
        動画      ライブ    ラジオ / 記事 / TV
```

### 出演の3パターン

| パターン | 例 |
|---------|-----|
| ピン（個人） | メンバーAが単独でトーク番組に出演 |
| コンビ/トリオ | ドンデコルテとしてネタ動画に出演 |
| ユニット | 複数コンビ合同で企画ライブに出演 |

→ 全コンテンツ（動画・ライブ・ラジオ・記事・TV）で、この3パターンを表現できる設計にする。

---

## テーブル一覧

### 人・グループ系（6テーブル）

| テーブル | 役割 |
|---------|------|
| artists | 芸人個人 |
| comedy_groups | コンビ・トリオ（恒常グループ） |
| comedy_group_members | コンビのメンバー |
| units | ユニット（複数コンビ/個人の集合） |
| unit_members | ユニットの構成（コンビ単位 or 個人単位） |
| achievements | 受賞歴・大会実績 |

### コンテンツ系（6テーブル）

| テーブル | 役割 |
|---------|------|
| videos | YouTube動画 |
| lives | ライブ・イベント |
| radios | ラジオ |
| articles | インタビュー・記事 |
| tv_shows | テレビ番組 |
| topics | トピック（雑多な情報） |

### 出演（cast）系（6テーブル）

| テーブル | 役割 |
|---------|------|
| video_casts | 動画の出演者 |
| live_casts | ライブの出演者 |
| radio_casts | ラジオの出演者 |
| article_casts | 記事の出演者 |
| tv_show_casts | TV番組の出演者 |
| topic_casts | トピックの関連出演者 |

### パーソナルデータ系（1テーブル）

| テーブル | 役割 |
|---------|------|
| memos | 各コンテンツへのメモ（閲覧は公開、書き込みは認証ユーザーのみ） |

**cast テーブルの共通構造:**
- `artist_id` / `comedy_group_id` / `unit_id` のうち **1つだけ** NOT NULL
- → ピン/コンビ/ユニットどれとしての出演かが明確になる

### 合計: 19テーブル

---

## SQL（Supabase用）

```sql
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
  )
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
-- 7. 動画出演
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
-- 8. ライブ
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
-- 9. ライブ出演
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
-- 10. ラジオ
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
-- 11. ラジオ出演
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
-- 12. 記事/インタビュー
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
-- 13. 記事出演
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
-- 14. テレビ番組
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
-- 15. テレビ出演
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
-- 16. トピック（雑多な情報）
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
-- 17. トピック出演
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
-- 18. メモ（ポリモーフィック）
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

create index idx_article_casts_artist on article_casts(artist_id) where artist_id is not null;
create index idx_article_casts_group on article_casts(comedy_group_id) where comedy_group_id is not null;

create index idx_tv_show_casts_artist on tv_show_casts(artist_id) where artist_id is not null;
create index idx_tv_show_casts_group on tv_show_casts(comedy_group_id) where comedy_group_id is not null;

create index idx_topic_casts_artist on topic_casts(artist_id) where artist_id is not null;
create index idx_topic_casts_group on topic_casts(comedy_group_id) where comedy_group_id is not null;

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

-- 読み取り：全員OK（メモ以外）
-- ※ 全テーブルに対して同じパターン
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
```

---

## よく使うクエリ例

### ドンデコルテの出演動画を全部取得

```sql
-- comedy_groups.name = 'ドンデコルテ' のIDを取得
select v.*
from videos v
join video_casts vc on v.id = vc.video_id
join comedy_groups cg on vc.comedy_group_id = cg.id
where cg.name = 'ドンデコルテ'
order by v.published_at desc;
```

### ある芸人の全出演（コンテンツ種別横断）

```sql
-- artist_id = :id の人が出ている全コンテンツ
-- ピンの場合
select 'video' as type, v.title, v.published_at
from videos v join video_casts vc on v.id = vc.video_id
where vc.artist_id = :id

union all

-- コンビとしての出演も含める
select 'video' as type, v.title, v.published_at
from videos v
join video_casts vc on v.id = vc.video_id
join comedy_group_members cgm on vc.comedy_group_id = cgm.comedy_group_id
where cgm.artist_id = :id

order by published_at desc;
```

### 共演ランキング（ドンデコルテと最も共演が多いコンビ）

```sql
with dondecorte_videos as (
  select vc.video_id
  from video_casts vc
  join comedy_groups cg on vc.comedy_group_id = cg.id
  where cg.name = 'ドンデコルテ'
)
select cg.name, count(*) as co_appearances
from video_casts vc
join comedy_groups cg on vc.comedy_group_id = cg.id
where vc.video_id in (select video_id from dondecorte_videos)
  and cg.name != 'ドンデコルテ'
group by cg.name
order by co_appearances desc
limit 10;
```

---

## タスク一覧

### Phase 1: MVP（自分用Wiki + 管理画面）

| # | タスク | 見積 | 依存 |
|---|--------|------|------|
| 1-1 | Supabaseプロジェクト作成 | 0.5h | - |
| 1-2 | DB マイグレーション実行（上記SQL） | 1h | 1-1 |
| 1-3 | Next.js プロジェクト初期化（App Router） | 1h | - |
| 1-4 | Supabase Auth 設定（メール or Google） | 2h | 1-1, 1-3 |
| 1-5 | 認証ミドルウェア（管理画面を保護） | 2h | 1-4 |
| 1-6 | 管理画面：レイアウト + サイドバー | 2h | 1-5 |
| 1-7 | 管理画面：芸人 CRUD | 3h | 1-6 |
| 1-8 | 管理画面：コンビ CRUD + メンバー紐付け | 4h | 1-7 |
| 1-9 | 管理画面：ユニット CRUD + メンバー紐付け | 3h | 1-8 |
| 1-10 | 管理画面：受賞歴 CRUD | 2h | 1-7, 1-8 |
| 1-11 | 管理画面：動画 CRUD + 出演者紐付け | 4h | 1-7, 1-8 |
| 1-12 | 管理画面：ライブ CRUD + 出演者紐付け | 3h | 1-11 |
| 1-13 | 管理画面：ラジオ CRUD + 出演者紐付け | 2h | 1-11 |
| 1-14 | 管理画面：記事 CRUD + 出演者紐付け | 2h | 1-11 |
| 1-15 | 管理画面：テレビ CRUD + 出演者紐付け | 2h | 1-11 |
| 1-16 | 管理画面：トピック CRUD + 出演者紐付け | 2h | 1-11 |
| 1-17 | 公開側レイアウト（ヘッダー + フッター + ボトムナビ） | 3h | 1-2 |
| 1-18 | 公開側：トップページ（最新コンテンツ + 直近ライブ） | 3h | 1-17 |
| 1-19 | 公開側：動画一覧 + 詳細（YouTube埋め込み） | 3h | 1-17 |
| 1-20 | 公開側：ライブ一覧 | 2h | 1-17 |
| 1-21 | 公開側：コンビ/芸人 詳細ページ（受賞歴 + SNS） | 4h | 1-17 |
| 1-22 | 公開側：ラジオ・記事・TV・トピック 一覧 | 4h | 1-17 |
| 1-23 | 公開側：メモ機能（各コンテンツ詳細にメモ欄） | 3h | 1-19, 1-4 |
| 1-24 | 公開側：フッター免責事項 | 0.5h | 1-17 |
| 1-25 | Vercel デプロイ + 環境変数設定 | 1h | 全部 |
| 1-26 | 初期データ投入（ドンデコルテ関連） | 2h | 1-25 |

**Phase 1 合計: 約58h（10〜14日）**

---

### Phase 2: ブログ化 + UX強化

| # | タスク | 見積 | 依存 |
|---|--------|------|------|
| 2-1 | タグ機能 DB追加（tags, taggings テーブル） | 2h | Phase1 |
| 2-2 | 管理画面：タグ管理 | 2h | 2-1 |
| 2-3 | 記事ページ（Markdown対応） | 4h | Phase1 |
| 2-4 | SEO対応（メタタグ, OGP, sitemap） | 3h | Phase1 |
| 2-5 | 詳細ページ充実（関連コンテンツ表示） | 3h | Phase1 |
| 2-6 | レスポンシブ対応 | 2h | Phase1 |
| 2-7 | コンテンツ記事執筆（3本〜） | 6h | 2-3 |
| 2-8 | お気に入り機能（favorites テーブル + UI） | 4h | Phase1 |
| 2-9 | タイムライン表示（全コンテンツ時系列） | 4h | Phase1 |
| 2-10 | フィルタ・並び替え（一覧ページ） | 3h | Phase1 |
| 2-11 | タブ横スクロール対応（モバイルUX） | 1h | Phase1 |
| 2-12 | 視聴済みフラグ | 2h | Phase1 |

**Phase 2 合計: 約36h（5〜8日）**

---

### Phase 3: 半自動化

| # | タスク | 見積 | 依存 |
|---|--------|------|------|
| 3-1 | YouTube Data API セットアップ | 2h | Phase1 |
| 3-2 | チャンネルID取得 + 動画一覧API実装 | 4h | 3-1 |
| 3-3 | 新着動画の自動保存ロジック | 4h | 3-2 |
| 3-4 | cron設定（Vercel Cron or Edge Functions） | 3h | 3-3 |
| 3-5 | 自動取得動画のレビュー機能（承認/却下） | 4h | 3-4 |
| 3-6 | 出演者の自動タグ付け（タイトル解析） | 6h | 3-5 |

**Phase 3 合計: 約23h（5〜7日）**

---

### Phase 4: 通知・分析

| # | タスク | 見積 | 依存 |
|---|--------|------|------|
| 4-1 | ライブ通知（メール or LINE Notify） | 6h | Phase1 |
| 4-2 | Googleカレンダー連携 | 4h | Phase1 |
| 4-3 | 共演分析ページ | 6h | Phase1 |
| 4-4 | 出演回数ランキング | 3h | Phase1 |
| 4-5 | 相関図（D3.js） | 8h | 4-3 |
| 4-6 | cast統合テーブル（UNION回避） | 6h | 4-3 |
| 4-7 | Server Actions → services層 分離 | 4h | Phase3 |

**Phase 4 合計: 約37h（7〜12日）**

---

## 注意点・設計判断メモ

### なぜ `groups` ではなく `comedy_groups` か
→ `groups` はSQLの予約語。避けるのが無難。

### cast テーブルの CHECK 制約
→ `(artist_id is not null)::int + (comedy_group_id is not null)::int + (unit_id is not null)::int = 1`
→ 必ず1つだけ指定される。0個や2個以上はDBレベルで防ぐ。

### ソフトデリート
→ Phase1では物理削除でOK。必要になったら `deleted_at` カラムを追加。

### タグ機能
→ Phase2で追加。Phase1のDB設計には含めない（テーブルが増えすぎるため）。

### 1つの動画にコンビ出演 + ピン出演が混在する場合
→ cast テーブルに複数行入れる。例：ドンデコルテの動画にゲストが1人ピンで出演
→ video_casts に2行: comedy_group_id=ドンデコルテ, artist_id=ゲスト

### SNSリンクについて
→ `artists` と `comedy_groups` にSNSカラムを追加。
→ x_url, instagram_url, note_url, youtube_channel_url, standfm_url, tiktok_url, website_url
→ コンビ詳細・芸人詳細ページのプロフィール欄にアイコン付きで表示。

### メモ機能について
→ ポリモーフィック設計: `target_type` + `target_id` で全コンテンツに紐付け。
→ 外部キー制約はかけられないが、自分専用アプリなので問題なし。
→ RLSで認証ユーザーのみ読み書き可能（公開ページには表示しない）。
→ ログイン状態でのみメモ入力欄が表示される。

### theme_color について
→ `comedy_groups` に `theme_color` カラムを追加。
→ サイト上で出演者タグの色分けに使用。
→ 例: ドンデコルテ = #6BB8D4

### youtube_channel_id について
→ `comedy_groups` に `youtube_channel_id` を追加。
→ Phase3のYouTube自動取得で、チャンネルIDでフィルタリングするために使用。
→ `videos.youtube_channel_id` と組み合わせて「この動画はどのチャンネルから取得したか」を追跡。

---

## 著作権・法的注意事項

### サイトの位置づけ
→ 非公式ファンサイト。ドンデコルテおよび吉本興業とは無関係。

### 問題のない範囲
- 事実情報（出演日、会場名、番組名、結成年など）は著作権の対象外
- YouTubeの公式埋め込みプレーヤー（YouTube利用規約で許可）
- YouTube APIが提供するサムネイルURLの表示
- 外部サイトへのリンク（note、Instagram、チケットサイト等）

### 禁止事項（実装時の注意）
- 公式写真・テレビキャプチャの自前ホスティング → NG
- 記事・インタビュー本文の転載 → NG（リンクのみ）
- 公式ロゴの無断使用 → NG

### 必須対応
1. フッターに免責事項を表示:
   「本サイトはドンデコルテおよび吉本興業とは無関係の非公式ファンサイトです。
    掲載情報の正確性は保証しません。権利者様からの削除要請には速やかに対応いたします。」
2. 問い合わせ先（メールアドレス）を設置
3. 権利者からの削除要請に即対応できる運用体制

### 推奨対応
- サイト内に引用元・出典を明記する
