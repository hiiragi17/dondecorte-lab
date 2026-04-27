"use client";

import { useCallback, useState, useTransition } from "react";
import {
  createMemo,
  deleteMemo,
  updateMemo,
} from "@/lib/actions/memos";
import type { ContentType } from "@/lib/types";
import type { MemoFormState } from "@/lib/types/memo";

type Options = {
  targetType: ContentType;
  targetId: string;
};

export function useMemoCreate({ targetType, targetId }: Options) {
  const [state, setState] = useState<MemoFormState>({});
  const [pending, startTransition] = useTransition();

  const submit = useCallback(
    (formData: FormData, onSuccess?: () => void) => {
      formData.set("target_type", targetType);
      formData.set("target_id", targetId);
      startTransition(async () => {
        const result = await createMemo({}, formData);
        if (result.error || result.fieldError) {
          setState(result);
        } else {
          setState({});
          onSuccess?.();
        }
      });
    },
    [targetType, targetId]
  );

  return { state, submit, pending };
}

export function useMemoUpdate({ targetType, targetId }: Options) {
  const [state, setState] = useState<MemoFormState>({});
  const [pending, startTransition] = useTransition();

  const submit = useCallback(
    (formData: FormData, onSuccess?: () => void) => {
      formData.set("target_type", targetType);
      formData.set("target_id", targetId);
      startTransition(async () => {
        const result = await updateMemo({}, formData);
        if (result.error || result.fieldError) {
          setState(result);
        } else {
          setState({});
          onSuccess?.();
        }
      });
    },
    [targetType, targetId]
  );

  return { state, submit, pending };
}

export function useMemoDelete({ targetType, targetId }: Options) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    (memoId: string) => {
      setError(null);
      const formData = new FormData();
      formData.set("id", memoId);
      formData.set("target_type", targetType);
      formData.set("target_id", targetId);
      startTransition(async () => {
        try {
          await deleteMemo(formData);
        } catch (e) {
          setError(e instanceof Error ? e.message : "メモの削除に失敗しました");
        }
      });
    },
    [targetType, targetId]
  );

  return { remove, pending, error };
}
