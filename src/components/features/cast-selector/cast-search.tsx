"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function CastSearch({ value, onChange, placeholder, ariaLabel }: Props) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "名前で検索"}
      aria-label={ariaLabel ?? placeholder ?? "名前で検索"}
      className="mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-sm text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
    />
  );
}
