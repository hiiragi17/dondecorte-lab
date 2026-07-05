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
