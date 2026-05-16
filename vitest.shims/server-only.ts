// `server-only` は Next.js が解決する仮想モジュールで npm パッケージとしては存在しない。
// vitest（vite）からは解決できないため、テスト時はこの空モジュールにエイリアスする。
export {};
