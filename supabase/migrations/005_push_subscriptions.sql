-- ============================================
-- Web Push 購読端末（push_subscriptions）
-- ============================================
-- Web Push（VAPID）の購読端末を保持するテーブル。
-- 自分専用アプリだが家族・友人にも配れるよう user_id への紐付けは省略し、
-- 1端末 = 1 subscription として複数行が並ぶ想定。

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,               -- プッシュサービスの送信先 URL
  p256dh text not null,                        -- 公開鍵（暗号化用）
  auth text not null,                          -- 認証シークレット
  user_agent text,                             -- 登録端末の User-Agent（管理画面の識別用）
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table push_subscriptions is
  'Web Push の購読端末。endpoint/p256dh/auth は機微情報のため anon からは一切アクセスさせず、サーバ側（API Route / Server Action）から service_role 経由でのみ読み書きする。';

-- ============================================
-- RLS
-- ============================================
-- endpoint / p256dh / auth が漏れると第三者が任意の端末へプッシュ送信できてしまうため、
-- anon / authenticated 向けのポリシーは一切付けない。
-- RLS を有効化したうえでポリシー無し = 全アクセス拒否となり、
-- RLS をバイパスする service_role キー経由のサーバ処理のみが読み書きできる。
alter table push_subscriptions enable row level security;
