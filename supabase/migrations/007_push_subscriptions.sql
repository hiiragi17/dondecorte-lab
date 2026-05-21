-- ============================================
-- Web Push 購読端末（push_subscriptions）
-- ============================================
-- Web Push（VAPID）でスマホ等にプッシュ通知を送るための購読情報を保持する。
-- 後続の Fany 連携（先行抽選通知）や YouTube 新着通知などで使い回す。
--
-- 自分専用アプリだが家族・友人にも配れるよう user_id への紐付けは省略する。
-- 1 端末 = 1 行（複数端末で複数 subscription が並ぶ想定）。

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table push_subscriptions is
  'Web Push（VAPID）の購読端末。endpoint / p256dh / auth は機微情報のため anon には読ませない';

-- ============================================
-- RLS
-- ============================================
-- insert: anon 可（誰でも自分の端末を購読登録できる）
-- select / delete / update: ポリシー無し → anon / authenticated からは不可。
--   購読一覧の取得・GC（404/410 の削除）はサーバ側（Route Handler / Server Action）から
--   service_role キーで実行する（service_role は RLS をバイパスする）。
alter table push_subscriptions enable row level security;

create policy push_subscriptions_insert
  on push_subscriptions for insert to anon, authenticated with check (true);
