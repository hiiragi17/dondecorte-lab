"use client";

import { useFormStatus } from "react-dom";

type Props = {
  name: string;
};

export function ArtistDeleteButton({ name }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`「${name}」を削除します。よろしいですか？`)) {
          event.preventDefault();
        }
      }}
      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}
