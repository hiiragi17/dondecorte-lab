-- ============================================
-- 05. videos（YouTube動画）
-- ============================================
-- ドンデコルテ公式チャンネル（UC4y-_Xwudf7gB5sXsbipDkQ）および
-- 大会公式チャンネルの代表動画を登録する。
--
-- 動画は基本的に YouTube Data API による自動同期で投入する想定だが、
-- 主要動画（M-1決勝ネタ等）は seed で登録しておく。
-- youtube_video_id に UNIQUE 制約があるため ON CONFLICT で再実行可能。

-- source / review_status を明示する。YouTube 自動同期（syncChannelVideos）が先に
-- 同じ動画を youtube_auto / pending で取り込んでいた場合、ON CONFLICT の更新で
-- manual / approved へ引き上げないと、seed で主要動画として登録したつもりでも
-- 公開側（review_status = 'approved' で絞り込み）に出てこないため。
insert into videos (
  id, title, youtube_url, youtube_video_id, youtube_channel_id,
  thumbnail_url, published_at, description, source, review_status
) values
  (
    '77777777-7777-4777-8777-000000000001',
    'ドンデコルテ【決勝ネタ】＜ファーストラウンド＞ M-1グランプリ2025',
    'https://www.youtube.com/watch?v=T37pceaYiOg',
    'T37pceaYiOg',
    null,  -- M-1公式チャンネル投稿のためドンデコルテch ID は付与しない
    'https://i.ytimg.com/vi/T37pceaYiOg/hqdefault.jpg',
    '2025-12-21 21:00:00+09',
    'M-1グランプリ2025 決勝ファーストラウンド ドンデコルテのネタ。845点で最終決戦進出、結果は準優勝。',
    'manual', 'approved'
  ),
  (
    '77777777-7777-4777-8777-000000000002',
    '【8/29】ドンデコルテ冠特番「人間、銀次。」【予告編】',
    'https://www.youtube.com/watch?v=auZCfaBVKkk',
    'auZCfaBVKkk',
    null,  -- 投稿チャンネル未確認のため付与しない
    'https://i.ytimg.com/vi/auZCfaBVKkk/hqdefault.jpg',
    null,  -- 公開日未確認
    'チャンネルNECOで2026年8月29日に放送されるドンデコルテ冠特番「人間、銀次。」の予告編。',
    'manual', 'approved'
  ),
  (
    '77777777-7777-4777-8777-000000000003',
    'ドンデコルテ渡辺銀次、「とりあえず生」に物申す！名演説ぶつもまさかの結末',
    'https://www.youtube.com/watch?v=ko_2lU-ghcU',
    'ko_2lU-ghcU',
    null,
    'https://i.ytimg.com/vi/ko_2lU-ghcU/hqdefault.jpg',
    null,
    'キリン「一番搾り生ビール」WEB CM『とりあえず頼む人へ』篇関連の動画。渡辺銀次が“とりあえず生”に演説をぶつ。',
    'manual', 'approved'
  ),
  (
    '77777777-7777-4777-8777-000000000004',
    '【まさかの涙】ドンデコルテがドッキリでコンビ愛を示す「仕掛け人マウントバトル」〈現在はTELASAで全編配信中〉',
    'https://www.youtube.com/watch?v=QMddnV_2CVw',
    'QMddnV_2CVw',
    null,
    'https://i.ytimg.com/vi/QMddnV_2CVw/hqdefault.jpg',
    null,
    '「くりぃむナンタラ」のドッキリ企画で小橋共作が涙を見せた回の切り抜き。全編はTELASA / ABEMAで配信。',
    'manual', 'approved'
  )
on conflict (youtube_video_id) do update set
  title = excluded.title,
  youtube_url = excluded.youtube_url,
  youtube_channel_id = excluded.youtube_channel_id,
  thumbnail_url = excluded.thumbnail_url,
  published_at = excluded.published_at,
  description = excluded.description,
  source = excluded.source,
  review_status = excluded.review_status,
  updated_at = now();

-- 出演登録
-- cast は #47 で単一 casts テーブル（content_type + content_id のポリモーフィック設計）に統合済み。
-- 注: youtube_video_id で引くこと。同じ動画が API 同期等により別UUIDで
-- 既存登録されている場合、ON CONFLICT (youtube_video_id) は既存行の id を
-- 保ったまま UPDATE するため、ハードコード UUID で引くと cast が紐付かない。
insert into casts (content_type, content_id, comedy_group_id)
select 'video', id, '22222222-2222-4222-8222-000000000001'
from videos
where youtube_video_id in (
  'T37pceaYiOg',
  'auZCfaBVKkk',
  'ko_2lU-ghcU',
  'QMddnV_2CVw'
)
on conflict do nothing;

-- ※ ドンデコルテ公式ch（UC4y-_Xwudf7gB5sXsbipDkQ）の個別動画は
--   YouTube Data API 同期スクリプトから投入する運用とする。
