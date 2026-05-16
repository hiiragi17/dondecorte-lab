"use client";

import { useCallback, useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed";

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

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY
  );
}

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const resolveStatus = async (): Promise<Status> => {
      if (!isSupported()) return "unsupported";
      if (Notification.permission === "denied") return "denied";
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription ? "subscribed" : "unsubscribed";
      } catch {
        return "unsubscribed";
      }
    };

    resolveStatus().then((next) => {
      if (active) setStatus(next);
    });

    return () => {
      active = false;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) {
        await subscription.unsubscribe();
        throw new Error("購読の登録に失敗しました");
      }

      setStatus("subscribed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "通知の登録に失敗しました"
      );
    } finally {
      setPending(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const { endpoint } = subscription;
        await subscription.unsubscribe();
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        if (!res.ok) {
          setError("サーバ側の購読解除に失敗しました（端末側は解除済みです）");
        }
      }
      setStatus("unsubscribed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "通知の解除に失敗しました"
      );
    } finally {
      setPending(false);
    }
  }, []);

  if (status === "loading" || status === "unsupported") {
    return null;
  }

  return (
    <section className="mb-10 md:mb-14">
      <div className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-brand-cream sm:text-base">
              新着情報をプッシュ通知で受け取る
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              ライブの先行抽選開始など、新しい情報をスマホに通知します。
            </p>
          </div>

          {status === "denied" ? (
            <p className="shrink-0 text-xs text-brand-muted">
              ブラウザの設定で通知がブロックされています。
            </p>
          ) : status === "subscribed" ? (
            <button
              type="button"
              onClick={unsubscribe}
              disabled={pending}
              className="shrink-0 rounded-md border border-brand-border-dark px-4 py-2 text-sm font-medium text-brand-cream transition hover:border-brand-sky-light disabled:opacity-50"
            >
              {pending ? "処理中…" : "通知をオフにする"}
            </button>
          ) : (
            <button
              type="button"
              onClick={subscribe}
              disabled={pending}
              className="shrink-0 rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark disabled:opacity-50"
            >
              {pending ? "処理中…" : "通知をオンにする"}
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
