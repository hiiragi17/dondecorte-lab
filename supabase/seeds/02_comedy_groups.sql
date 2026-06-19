-- ============================================
-- 02. comedy_groups（コンビ）
-- ============================================
-- ドンデコルテ本体および、ツーマンライブ等で共演する関連コンビを登録する。
-- 共演コンビは最低限の情報のみ（後から管理画面で拡充する想定）。

insert into comedy_groups (
  id, name, kana_name, group_type, description, formed_year,
  theme_color,
  youtube_channel_url, youtube_channel_id,
  standfm_url
) values
  (
    '22222222-2222-4222-8222-000000000001',
    'ドンデコルテ',
    'どんでこるて',
    'combo',
    '吉本興業（東京本社）所属。2019年11月、渡辺銀次（ボケ）と小橋共作（ツッコミ）で結成。M-1グランプリ2025準優勝。',
    2019,
    '#6BB8D4',  -- 小橋共作の水色をベースに（渡辺銀次の茶色 #5C3D2E と合わせて使用）
    'https://www.youtube.com/channel/UC4y-_Xwudf7gB5sXsbipDkQ',
    'UC4y-_Xwudf7gB5sXsbipDkQ',
    'https://stand.fm/channels/6027cd1585b142d0d8c2b1b8'
  ),
  (
    '22222222-2222-4222-8222-000000000002',
    'たくろう',
    'たくろう',
    'combo',
    'M-1グランプリ2025優勝。2026年5月にドンデコルテとツーマンライブを開催。',
    null,
    null, null, null, null
  ),
  (
    '22222222-2222-4222-8222-000000000003',
    'カゲヤマ',
    'かげやま',
    'combo',
    '2026年2月にドンデコルテとツーマンライブ「教祖様ぁぁあ！！」を大宮ラクーンよしもと劇場にて開催。',
    null,
    null, null, null, null
  )
on conflict (id) do update set
  name = excluded.name,
  kana_name = excluded.kana_name,
  group_type = excluded.group_type,
  description = excluded.description,
  formed_year = excluded.formed_year,
  theme_color = excluded.theme_color,
  youtube_channel_url = excluded.youtube_channel_url,
  youtube_channel_id = excluded.youtube_channel_id,
  standfm_url = excluded.standfm_url,
  updated_at = now();
