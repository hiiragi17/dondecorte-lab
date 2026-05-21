"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  vapidPublicKey: string;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushToggle({ vapidPublicKey }: Props) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) {
      setSubscribed(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false));
  }, []);

  const subscribe = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("通知が許可されませんでした。");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        await sub.unsubscribe();
        throw new Error("購読の登録に失敗しました");
      }
      setSubscribed(true);
      setMessage("通知をオンにしました。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "通知の設定に失敗しました。");
    } finally {
      setBusy(false);
    }
  }, [vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        if (!res.ok) {
          throw new Error("購読の解除に失敗しました");
        }
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMessage("通知をオフにしました。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "通知の解除に失敗しました。");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!supported) {
    return (
      <p className="text-xs text-brand-muted">
        この端末では通知に対応していません。iPhone の場合はホーム画面に追加すると通知を受け取れます。
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={busy || subscribed === null}
        className="inline-flex items-center gap-2 rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-xs font-medium text-brand-cream transition hover:border-brand-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {subscribed === null
          ? "確認中..."
          : busy
            ? "処理中..."
            : subscribed
              ? "🔔 通知をオフにする"
              : "🔔 ライブ・先行抽選の通知を受け取る"}
      </button>
      {message ? <p className="text-xs text-brand-muted">{message}</p> : null}
    </div>
  );
}
