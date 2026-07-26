-- ============================================
-- 01. artists（芸人個人）
-- ============================================
-- ドンデコルテのメンバー2名を登録する。
-- 固定UUIDを使うことで再実行しても安全（ON CONFLICT DO UPDATE）。

insert into artists (
  id, name, kana_name, profile, debut_year,
  x_url, instagram_url, youtube_channel_url
) values
  (
    '11111111-1111-4111-8111-000000000001',
    '渡辺銀次',
    'わたなべ ぎんじ',
    '1985年8月2日生まれ。山口県周南市出身。ドンデコルテのボケ担当。演説スタイルの漫才で知られる。趣味はけん玉、読書、日本文学。R-1グランプリ2026ファイナリスト。',
    2008,
    'https://x.com/10000nabe',
    null,
    null
  ),
  (
    '11111111-1111-4111-8111-000000000002',
    '小橋共作',
    'こばし きょうさく',
    '1989年6月17日生まれ。沖縄県宜野湾市出身。ドンデコルテのツッコミ担当。',
    2012,
    null,
    null,
    null
  )
on conflict (id) do update set
  name = excluded.name,
  kana_name = excluded.kana_name,
  profile = excluded.profile,
  debut_year = excluded.debut_year,
  x_url = excluded.x_url,
  instagram_url = excluded.instagram_url,
  youtube_channel_url = excluded.youtube_channel_url,
  updated_at = now();
