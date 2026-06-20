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
  ),
  -- 漫才師ユニット「男坂」共演コンビ
  (
    '22222222-2222-4222-8222-000000000004',
    '素敵じゃないか',
    'すてきじゃないか',
    'combo',
    '吉本興業所属の漫才コンビ。ABCラジオ「がっちゃんこ」月曜や漫才師ユニット「男坂」でドンデコルテと共演。',
    null,
    null, null, null, null
  ),
  (
    '22222222-2222-4222-8222-000000000005',
    'ミカボ',
    'みかぼ',
    'combo',
    '吉本興業所属の漫才コンビ。漫才師ユニット「男坂」でドンデコルテと共演。',
    null,
    null, null, null, null
  ),
  (
    '22222222-2222-4222-8222-000000000006',
    'おふろ',
    'おふろ',
    'combo',
    '吉本興業所属の漫才コンビ。漫才師ユニット「男坂」でドンデコルテと共演。',
    null,
    null, null, null, null
  ),
  -- 漫才ユニットライブ「カルテット」共演コンビ
  (
    '22222222-2222-4222-8222-000000000007',
    'ビスケットブラザーズ',
    'びすけっとぶらざーず',
    'combo',
    '吉本興業所属の漫才コンビ。漫才ユニットライブ「カルテット」でドンデコルテと共演。',
    null,
    null, null, null, null
  ),
  (
    '22222222-2222-4222-8222-000000000008',
    '滝音',
    'たきおん',
    'combo',
    '吉本興業所属の漫才コンビ。漫才ユニットライブ「カルテット」でドンデコルテと共演。',
    null,
    null, null, null, null
  ),
  (
    '22222222-2222-4222-8222-000000000009',
    '9番街レトロ',
    'きゅうばんがいれとろ',
    'combo',
    '吉本興業所属の漫才コンビ。漫才ユニットライブ「カルテット」でドンデコルテと共演。',
    null,
    null, null, null, null
  )
on conflict (id) do update set
  name = excluded.name,
  kana_name = excluded.kana_name,
  group_type = excluded.group_type,
  description = excluded.description,
  -- 拡充カラムは coalesce で既存の非NULL値を温存する。
  -- 共演コンビは NULL で seed しているため、管理画面で後から入れた値を
  -- 再seedで上書き（NULL化）しないようにする（seedに値があればそちらを優先）。
  formed_year = coalesce(excluded.formed_year, comedy_groups.formed_year),
  theme_color = coalesce(excluded.theme_color, comedy_groups.theme_color),
  youtube_channel_url = coalesce(excluded.youtube_channel_url, comedy_groups.youtube_channel_url),
  youtube_channel_id = coalesce(excluded.youtube_channel_id, comedy_groups.youtube_channel_id),
  standfm_url = coalesce(excluded.standfm_url, comedy_groups.standfm_url),
  updated_at = now();
