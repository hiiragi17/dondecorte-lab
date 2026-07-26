-- ============================================
-- 12. cms（CM・広告案件）
-- ============================================
-- ドンデコルテのCM・タイアップ案件を登録する。
-- M-1グランプリ2025準優勝（2025年12月）以降、2026年に入って一気に増えている。
-- aired_on は公開開始日が確認できたものだけ投入し、不明なものは null（推定値は入れない）。
-- 固定UUID（cccc...）+ ON CONFLICT で再実行安全。

insert into cms (
  id, title, advertiser, product, url, aired_on, description
) values
  (
    'cccccccc-cccc-4ccc-8ccc-000000000001',
    'レイク×ドンデコルテ オリジナル漫才',
    '新生フィナンシャル',
    'カードローン「レイク」',
    'https://prtimes.jp/main/html/rd/p/000000092.000036275.html',
    '2026-01-16',
    'ドンデコルテのCMデビュー作。テーマは「恋愛事情×365日間無利息」。持ち味の知的でハイテンポなしゃべくり漫才の形式で「初めての方限定 365日間無利息」を紹介する。ロングVer. / ショートVer. の2種類を公開。'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-000000000002',
    'TVCM『菌と鉄』（声の出演）',
    '講談社',
    '別冊少年マガジン連載『菌と鉄』',
    'https://prtimes.jp/main/html/rd/p/000008538.000001719.html',
    '2026-06-12',
    '「別冊少年マガジン」連載の片山あやか作『菌と鉄』のTVCMに、渡辺銀次・小橋共作の2人が声で出演。作品にちなんで金（菌）曜日に公開され、アフレコ現場に密着したメイキング版も同時公開された。'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-000000000003',
    'キリン一番搾り生ビール WEB CM『贅沢が怖い男』篇',
    'キリンビール',
    'キリン一番搾り生ビール',
    'https://natalie.mu/owarai/news/674837',
    '2026-06-05',
    'ドンデコルテが居酒屋で乾杯するWEB CM。単独ライブの世界観（益々荘・銀次チャーハン等）へのリスペクト演出が随所に盛り込まれている。'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-000000000004',
    'キリン一番搾り生ビール WEB CM『とりあえず頼む人へ』篇',
    'キリンビール',
    'キリン一番搾り生ビール',
    'https://www.advertimes.com/20260611/article547028/',
    '2026-06-10',
    '『贅沢が怖い男』篇に続く第2弾。渡辺銀次が「とりあえず生」に物申す名演説を披露する。'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-000000000005',
    'イースト駅前クリニック 新CM「風見鶏篇」',
    '医療法人社団イースト会',
    'イースト駅前クリニック（AGA・ED治療）',
    'https://prtimes.jp/main/html/rd/p/000000033.000052779.html',
    '2026-07-01',
    'ドンデコルテが新アンバサダーに就任。渡辺銀次が演じる風見鶏が男の自信を呼び覚ます内容で、7月1日より順次公開。'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-000000000006',
    'マクドナルド「もう一度ダブチ」キャンペーンCM',
    '日本マクドナルド',
    'ダブルチーズバーガー（もう一度ダブチ）',
    'https://www.advertimes.com/20260416/article541422/',
    '2026-04-08',
    '渡辺銀次が単独で出演したWeb CM。堺雅人出演の「青春を取り戻すバーガー」篇に連なるスペシャル動画で、演説から怒髪天「オトナノススメ」の熱唱へ転じる構成。公開直後からSNSで大反響となり、3000万再生を記録した。'
  )
on conflict (id) do update set
  title = excluded.title,
  advertiser = excluded.advertiser,
  product = excluded.product,
  url = excluded.url,
  aired_on = excluded.aired_on,
  description = excluded.description,
  updated_at = now();

-- ============================================
-- 出演登録
-- ============================================
-- コンビ名義の案件はドンデコルテ、渡辺銀次単独の案件は artist_id で紐付ける。
insert into casts (content_type, content_id, comedy_group_id)
select 'cm', id, '22222222-2222-4222-8222-000000000001'
from cms
where id in (
  'cccccccc-cccc-4ccc-8ccc-000000000001',
  'cccccccc-cccc-4ccc-8ccc-000000000002',
  'cccccccc-cccc-4ccc-8ccc-000000000003',
  'cccccccc-cccc-4ccc-8ccc-000000000004',
  'cccccccc-cccc-4ccc-8ccc-000000000005'
)
on conflict do nothing;

insert into casts (content_type, content_id, artist_id)
select 'cm', id, '11111111-1111-4111-8111-000000000001'  -- 渡辺銀次
from cms
where id = 'cccccccc-cccc-4ccc-8ccc-000000000006'
on conflict do nothing;
