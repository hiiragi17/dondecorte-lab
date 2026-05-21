"use client";

import { useState, useTransition } from "react";
import { sendTestPush } from "@/lib/actions/push";

export function TestPushButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await sendTestPush();
        if (result.ok) {
          const { sent, removed, failed } = result.summary;
          setMessage(
            `送信 ${sent}件 / 失効削除 ${removed}件 / 失敗 ${failed}件`
          );
        } else {
          setMessage(result.error);
        }
      } catch {
        setMessage("テスト通知の送信に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "送信中..." : "テスト通知を送信"}
      </button>
      {message ? (
        <p className="text-sm text-brand-brown-light">{message}</p>
      ) : null}
    </div>
  );
}
