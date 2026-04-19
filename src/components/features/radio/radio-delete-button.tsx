"use client";

type Props = {
  title: string;
};

export function RadioDeleteButton({ title }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(`「${title}」を削除しますか？`)) {
          e.preventDefault();
        }
      }}
      className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50"
    >
      削除
    </button>
  );
}
