-- ============================================
-- 07. radios（ラジオ番組）
-- ============================================
-- 公式雑談（stand.fm）、がっちゃんこ（ABCラジオ）、REQ JAM（JFN）を登録。
-- radios はエピソード単位の設計だが、ここでは番組（チャンネル）単位の代表エントリを登録する。
-- 個別エピソードは API/管理画面から追加する想定。

-- ラジオ番組本体
insert into radios (id, title, platform, url, description) values
  (
    '66666666-6666-4666-8666-000000000001',
    'ドンデコルテの公式雑談',
    'stand.fm',
    'https://stand.fm/channels/6027cd1585b142d0d8c2b1b8',
    'ドンデコルテによる stand.fm 公式チャンネル。毎週土曜21:00から生配信、不定期でゲリラ放送あり。'
  ),
  (
    '66666666-6666-4666-8666-000000000002',
    'がっちゃんこ（月曜：素敵じゃないか×ドンデコルテ）',
    'ABCラジオ',
    'https://stand.fm/episodes/69c5e6eef0f4da56b9ca8e4c',
    'ABCラジオと吉本興業によるベルト番組「がっちゃんこ」。月曜日は素敵じゃないかとドンデコルテが担当。2026年春からの新メンバー。'
  ),
  (
    '66666666-6666-4666-8666-000000000003',
    'REQ JAM【水曜】ドンデコルテ',
    'JFN',
    'https://jfn.co.jp/program/4588/',
    'JFN系列の新ラジオ番組。2026年4月1日スタート。リスナーからの「REQ」に応えるドンデコルテ担当の水曜回。'
  )
on conflict (id) do update set
  title = excluded.title,
  platform = excluded.platform,
  url = excluded.url,
  description = excluded.description,
  updated_at = now();

-- 出演登録（全てドンデコルテ）
insert into radio_casts (radio_id, comedy_group_id)
select id, '22222222-2222-4222-8222-000000000001'
from radios
where id in (
  '66666666-6666-4666-8666-000000000001',
  '66666666-6666-4666-8666-000000000002',
  '66666666-6666-4666-8666-000000000003'
)
on conflict do nothing;
