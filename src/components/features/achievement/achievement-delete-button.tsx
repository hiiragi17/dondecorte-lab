"use client";

import { useFormStatus } from "react-dom";

type Props = {
  title: string;
};

export function AchievementDeleteButton({ title }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`「${title}」を削除します。よろしいですか？`)) {
          event.preventDefault();
        }
      }}
      className="rounded-md border border-brand-gold px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}
