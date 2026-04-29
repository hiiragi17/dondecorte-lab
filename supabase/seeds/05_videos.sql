-- ============================================
-- 05. videos（YouTube動画）
-- ============================================
-- ドンデコルテ公式チャンネル（UC4y-_Xwudf7gB5sXsbipDkQ）および
-- 大会公式チャンネルの代表動画を登録する。
--
-- 動画は基本的に YouTube Data API による自動同期で投入する想定だが、
-- 主要動画（M-1決勝ネタ等）は seed で登録しておく。
-- youtube_video_id に UNIQUE 制約があるため ON CONFLICT で再実行可能。

insert into videos (
  id, title, youtube_url, youtube_video_id, youtube_channel_id,
  thumbnail_url, published_at, description
) values
  (
    '77777777-7777-4777-8777-000000000001',
    'ドンデコルテ【決勝ネタ】＜ファーストラウンド＞ M-1グランプリ2025',
    'https://www.youtube.com/watch?v=T37pceaYiOg',
    'T37pceaYiOg',
    null,  -- M-1公式チャンネル投稿のためドンデコルテch ID は付与しない
    'https://i.ytimg.com/vi/T37pceaYiOg/hqdefault.jpg',
    '2025-12-21 21:00:00+09',
    'M-1グランプリ2025 決勝ファーストラウンド ドンデコルテのネタ。845点で最終決戦進出、結果は準優勝。'
  )
on conflict (youtube_video_id) do update set
  title = excluded.title,
  youtube_url = excluded.youtube_url,
  youtube_channel_id = excluded.youtube_channel_id,
  thumbnail_url = excluded.thumbnail_url,
  published_at = excluded.published_at,
  description = excluded.description,
  updated_at = now();

-- 出演登録
-- 注: youtube_video_id で引くこと。同じ動画が API 同期等により別UUIDで
-- 既存登録されている場合、ON CONFLICT (youtube_video_id) は既存行の id を
-- 保ったまま UPDATE するため、ハードコード UUID で引くと cast が紐付かない。
insert into video_casts (video_id, comedy_group_id)
select id, '22222222-2222-4222-8222-000000000001'
from videos
where youtube_video_id = 'T37pceaYiOg'
on conflict do nothing;

-- ※ ドンデコルテ公式ch（UC4y-_Xwudf7gB5sXsbipDkQ）の個別動画は
--   YouTube Data API 同期スクリプトから投入する運用とする。
