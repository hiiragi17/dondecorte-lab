"use client";

import { useRef, useState } from "react";
import {
  useMemoCreate,
  useMemoDelete,
  useMemoUpdate,
} from "@/hooks/use-memo";
import type { ContentType } from "@/lib/types";

type MemoListItem = {
  id: string;
  content: string;
  timestamp: string;
};

type Props = {
  targetType: ContentType;
  targetId: string;
  memos: MemoListItem[];
};

const TEXTAREA_CLASS =
  "w-full resize-y rounded-md border border-brand-border-dark bg-brand-bg-dark px-3 py-2 text-sm text-brand-cream outline-none transition-colors duration-150 focus:border-brand-sky-light focus:outline focus:outline-1 focus:outline-brand-sky-light";

export function MemoEditor({ targetType, targetId, memos }: Props) {
  return (
    <div className="space-y-4">
      <MemoCreateForm targetType={targetType} targetId={targetId} />
      {memos.length === 0 ? (
        <p className="text-sm text-brand-muted">まだメモはありません。</p>
      ) : (
        <ul className="space-y-3">
          {memos.map((memo) => (
            <li key={memo.id}>
              <MemoItem
                memo={memo}
                targetType={targetType}
                targetId={targetId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemoCreateForm({
  targetType,
  targetId,
}: {
  targetType: ContentType;
  targetId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, submit, pending } = useMemoCreate({ targetType, targetId });

  return (
    <form
      ref={formRef}
      action={(formData) =>
        submit(formData, () => {
          formRef.current?.reset();
        })
      }
      className="space-y-2"
    >
      <textarea
        name="content"
        rows={3}
        defaultValue=""
        placeholder="メモを追加..."
        className={TEXTAREA_CLASS}
        disabled={pending}
      />
      {state.fieldError ? (
        <p className="text-xs text-red-400">{state.fieldError}</p>
      ) : null}
      {state.error ? (
        <p className="text-xs text-red-400">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-brand-sky/40 bg-brand-card-dark px-4 py-1.5 text-xs font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "追加中..." : "追加"}
        </button>
      </div>
    </form>
  );
}

function MemoItem({
  memo,
  targetType,
  targetId,
}: {
  memo: MemoListItem;
  targetType: ContentType;
  targetId: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <MemoEditForm
        memo={memo}
        targetType={targetType}
        targetId={targetId}
        onCancel={() => setEditing(false)}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <MemoView
      memo={memo}
      targetType={targetType}
      targetId={targetId}
      onEdit={() => setEditing(true)}
    />
  );
}

function MemoView({
  memo,
  targetType,
  targetId,
  onEdit,
}: {
  memo: MemoListItem;
  targetType: ContentType;
  targetId: string;
  onEdit: () => void;
}) {
  const { remove, pending, error } = useMemoDelete({ targetType, targetId });

  return (
    <div className="rounded-md border border-brand-border-dark bg-brand-bg-dark/60 p-3">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-cream">
        {memo.content}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-brand-muted">{memo.timestamp}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] text-brand-sky-light transition hover:text-brand-sky"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("このメモを削除しますか？")) remove(memo.id);
            }}
            disabled={pending}
            className="text-[11px] text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "削除中..." : "削除"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function MemoEditForm({
  memo,
  targetType,
  targetId,
  onCancel,
  onDone,
}: {
  memo: MemoListItem;
  targetType: ContentType;
  targetId: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { state, submit, pending } = useMemoUpdate({ targetType, targetId });

  return (
    <form
      action={(formData) => {
        formData.set("id", memo.id);
        submit(formData, onDone);
      }}
      className="space-y-2"
    >
      <textarea
        name="content"
        rows={3}
        defaultValue={memo.content}
        className={TEXTAREA_CLASS}
        disabled={pending}
      />
      {state.fieldError ? (
        <p className="text-xs text-red-400">{state.fieldError}</p>
      ) : null}
      {state.error ? (
        <p className="text-xs text-red-400">{state.error}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-xs text-brand-muted transition hover:text-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-brand-sky/40 bg-brand-card-dark px-4 py-1.5 text-xs font-medium text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
