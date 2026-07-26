-- ============================================
-- 13. magazines（雑誌掲載・写真集）
-- ============================================
-- ドンデコルテの雑誌掲載 / 写真集を登録する。
-- ※ 著作権対応: 本文・誌面は転載せず、タイトル・誌名・リンクのみを保持する。
-- published_on は発売日が確認できたものだけ投入し、不明なものは null。
-- 固定UUID（dddd...）+ ON CONFLICT で再実行安全。

insert into magazines (
  id, title, magazine_name, issue, publisher, url, published_on, description
) values
  (
    'dddddddd-dddd-4ddd-8ddd-000000000001',
    '【デジタル限定】ドンデコルテ写真集「残響」',
    '週プレ グラジャパ！',
    'デジタル写真集',
    '集英社',
    'https://www.shueisha.co.jp/books/items/contents.html?jdcn=08000000052388000000',
    '2026-05-25',
    'ドンデコルテ初のデジタル写真集。撮影は藤城貴則。1,980円（税込）で主要電子書店にて配信。「狂気×メロい＝狂メロ」がコンセプト。『週プレ グラジャパ！』での購入特典としてメイキング動画と小橋共作のセクシーカットが付属。配信後は『グラジャパ！』の歴代最高売上を更新した。'
  )
on conflict (id) do update set
  title = excluded.title,
  magazine_name = excluded.magazine_name,
  issue = excluded.issue,
  publisher = excluded.publisher,
  url = excluded.url,
  published_on = excluded.published_on,
  description = excluded.description,
  updated_at = now();

-- 出演登録（ドンデコルテ）
insert into casts (content_type, content_id, comedy_group_id)
select 'magazine', id, '22222222-2222-4222-8222-000000000001'
from magazines
where id = 'dddddddd-dddd-4ddd-8ddd-000000000001'
on conflict do nothing;
