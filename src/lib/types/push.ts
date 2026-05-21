// ブラウザの PushSubscription.toJSON() の形（subscribe API が受け取る payload）
export type PushSubscriptionJSON = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

// Service Worker の push ハンドラに渡す通知本文
export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

// push_subscriptions テーブルの行
export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};
