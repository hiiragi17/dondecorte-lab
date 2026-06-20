-- ============================================
-- 10. topics（トピック・雑多な情報）
-- ============================================
-- ライブ/動画/ラジオ/記事/TVに収まらない出来事を登録する。
-- topic_date は正確な日付が確認できたものだけ投入し、不明なものは null。
-- 固定UUID（aaaa...）+ ON CONFLICT で再実行安全。

insert into topics (
  id, title, content, url, source, topic_date
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    'ドンデコルテのオールナイトニッポン0（ZERO）に初登場',
    'M-1グランプリ2025準優勝で注目を集めるドンデコルテが、ニッポン放送『オールナイトニッポン0(ZERO)』に初登場。番組キーワードは「中年人語」。',
    'https://natalie.mu/owarai/news/671372',
    'お笑いナタリー',
    '2026-05-23'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
    '前身コンビ「news38」からドンデコルテへ改名',
    '渡辺銀次と小橋共作は2018年にコンビ「news38（ニュースサンパチ）」を結成し、翌2019年に「ドンデコルテ」へ改名した。',
    'https://profile.yoshimoto.co.jp/talent/detail?id=7310',
    '吉本興業 プロフィール',
    null
  )
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  url = excluded.url,
  source = excluded.source,
  topic_date = excluded.topic_date,
  updated_at = now();

-- 出演登録（全てドンデコルテ）
insert into casts (content_type, content_id, comedy_group_id)
select 'topic', id, '22222222-2222-4222-8222-000000000001'
from topics
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000002'
)
on conflict do nothing;
