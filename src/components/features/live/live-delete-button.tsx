"use client";

type Props = {
  title: string;
};

export function LiveDeleteButton({ title }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(`「${title}」を削除しますか？`)) {
          e.preventDefault();
        }
      }}
      className="rounded-md border border-brand-gold px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-cream"
    >
      削除
    </button>
  );
}
