-- ============================================
-- 08. articles（記事・インタビュー）
-- ============================================
-- ドンデコルテのインタビュー / 紹介記事を登録する。
-- ※ 著作権対応: 本文は転載せず、タイトル・媒体名・リンクのみを保持する（content は null）。
-- published_at は正確な公開日が確認できたものだけ投入し、不明なものは null（推定値は入れない）。
-- 固定UUID（8888...）+ ON CONFLICT で再実行安全。

insert into articles (
  id, title, url, source, published_at, content
) values
  (
    '88888888-8888-4888-8888-000000000001',
    'ドンデコルテ【M-1グランプリ2025 決勝直前インタビュー】「漫才っていいよねぇ〜！」',
    'https://magazine.fany.lol/259188/',
    'FANY Magazine',
    null,
    null
  ),
  (
    '88888888-8888-4888-8888-000000000002',
    '【M－1】準優勝ドンデコルテ結成秘話、相方から出された提案受け→40歳渡辺銀次が開花した',
    'https://news.yahoo.co.jp/articles/328e5252ea476dd2196b29cc9016e22320ba262c',
    '日刊スポーツ',
    null,
    null
  ),
  (
    '88888888-8888-4888-8888-000000000003',
    '人生の選択肢(3) 夢も希望もないから、続けている──M-1準優勝・ドンデコルテの現在地とこれから',
    'https://news.mynavi.jp/premium/article/choices-3/',
    'マイナビニュース',
    null,
    null
  ),
  (
    '88888888-8888-4888-8888-000000000004',
    'ドンデコルテ渡辺銀次・名物おじさんネタ「光って走る」の哲学的意味を語る',
    'https://miyearnzzlabo.com/archives/118361',
    'miyearnZZ Labo',
    null,
    null
  ),
  (
    '88888888-8888-4888-8888-000000000005',
    'ドンデコルテが『オールナイトニッポン0』に初登場! 5月23日に生放送が決定',
    'https://magazine.fany.lol/275990/',
    'FANY Magazine',
    null,
    null
  )
on conflict (id) do update set
  title = excluded.title,
  url = excluded.url,
  source = excluded.source,
  published_at = excluded.published_at,
  content = excluded.content,
  updated_at = now();

-- 出演登録
-- 基本はコンビ（ドンデコルテ）に紐付け。
-- 「光って走る」記事は渡辺銀次個人のインタビューのため artist_id で個人紐付け。
insert into casts (content_type, content_id, comedy_group_id)
select 'article', id, '22222222-2222-4222-8222-000000000001'
from articles
where id in (
  '88888888-8888-4888-8888-000000000001',
  '88888888-8888-4888-8888-000000000002',
  '88888888-8888-4888-8888-000000000003',
  '88888888-8888-4888-8888-000000000005'
)
on conflict do nothing;

insert into casts (content_type, content_id, artist_id)
select 'article', id, '11111111-1111-4111-8111-000000000001'  -- 渡辺銀次
from articles
where id = '88888888-8888-4888-8888-000000000004'
on conflict do nothing;
