export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};

// API Route が受け取る PushSubscription.toJSON() の必要部分
export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
};

// Service Worker の push ハンドラに渡す通知ペイロード
export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type PushBroadcastResult = {
  sent: number;
  failed: number;
  removed: number;
};

// 管理画面の購読端末一覧で扱う表示用の列のみ（p256dh/auth は含めない）
export type PushSubscriptionListItem = Pick<
  PushSubscriptionRow,
  "id" | "user_agent" | "created_at" | "last_seen_at"
>;
