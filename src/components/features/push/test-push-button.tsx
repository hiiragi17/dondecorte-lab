"use client";

import { useState, useTransition } from "react";
import { sendTestPush, type TestPushState } from "@/lib/actions/push";

export function TestPushButton() {
  const [state, setState] = useState<TestPushState>({});
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    setState({});
    startTransition(async () => {
      try {
        setState(await sendTestPush());
      } catch {
        setState({
          error: "テスト通知の送信に失敗しました。時間をおいて再試行してください。",
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark disabled:opacity-50"
      >
        {pending ? "送信中…" : "テスト通知を送信"}
      </button>

      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      {state.result ? (
        <p className="text-sm text-brand-brown-light">
          送信 {state.result.sent} 件 / 失敗 {state.result.failed} 件
          {state.result.removed > 0
            ? `（失効した ${state.result.removed} 件を削除しました）`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
