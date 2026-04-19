# DonDecorte Lab — テスト設計書

## 方針

自分専用アプリのため、**全面カバレッジを目指さず、壊れると影響が大きい箇所に絞って投資する**。
E2E は導入せず、Vitest によるユニット/コンポーネントテストに限定する。

### ゴール
- バリデーションロジックのリグレッション検知
- cast-selector（6コンテンツで使い回す最重要コンポーネント）の回帰防止
- 将来、Server Actions をリファクタしても壊していないと自信を持てる状態

### ノンゴール
- Supabase へのリアルアクセス（接続モックで代替）
- UI のピクセルパーフェクト検証
- E2E（Playwright）
- 100% カバレッジ

---

## 技術選定

| 項目 | 採用 | 理由 |
|------|------|------|
| テストランナー | **Vitest** | Next.js 16 / TS / ESM と相性が良く、設定が軽い |
| DOM 環境 | **jsdom** | React コンポーネントテストに必要 |
| コンポーネント | **@testing-library/react** | ユーザー視点のクエリでテスト |
| アサーション拡張 | **@testing-library/jest-dom** | `toBeInTheDocument` 等 |
| ユーザー操作 | **@testing-library/user-event** | `fireEvent` より実動作に近い |
| モック | Vitest 組込 `vi.mock` | Supabase クライアント差し替え用 |

React Hook Form は実フォームの振る舞いを検証したいため、モックせず実物を使う。

---

## 現状の課題（テスト容易性）

1. **バリデーションが Server Action 内にインライン化されている**
   - `parseFormData()` / `parseMembers()` が各 actions ファイルの private 関数として閉じている
   - 単体テストするには `export` するか `src/lib/utils/` に切り出す必要がある

2. **Supabase クライアントが直接 import されている**
   - Server Action 本体のテストには DI かモックが必要

### 対応方針

- **Phase 1 では切り出しを行わず**、テスト可能な純粋ロジックのみ対象にする
- Phase 2 で `parseFormData` 系を `src/lib/validators/` に抽出する（CLAUDE.md の「Phase4 で services 層に分離予定」と整合）

---

## テスト対象マトリクス

### 優先度 High（Phase 1）

| 対象 | 種別 | テスト観点 |
|------|------|-----------|
| `cast-selector.tsx` のフィルタ/重複排除ロジック | コンポーネント | タブ切替・検索（name / kana_name 部分一致）・選択済み除外・重複追加防止 |
| `cast-selector.tsx` の `handleAdd` / `handleRemove` | コンポーネント | 追加・削除時の CastEntry 配列整合性 |
| Unit members の type+id 複合キー重複排除 | ユニット | `'comedy_group:xxx'` と `'artist:xxx'` の混在時に誤検知しないこと |

### 優先度 Mid（Phase 2：ロジック抽出後）

| 対象 | 種別 | テスト観点 |
|------|------|-----------|
| `validators/artist.ts`（抽出後） | ユニット | name 必須・length・debut_year 範囲・URL プロトコル |
| `validators/combo.ts`（抽出後） | ユニット | theme_color hex 形式・members 重複排除・UUID |
| `validators/unit.ts`（抽出後） | ユニット | type enum・複合キー重複排除 |
| `validators/achievement.ts`（抽出後） | ユニット | target_type と target_id の条件付き整合（CHECK 制約相当） |

### 優先度 Low（当面やらない）

- Query 関数（薄い Supabase ラッパ。壊れたら型エラーで気付く）
- Server Action 全体（Supabase モックのコストに対して得られる保証が薄い）
- Form コンポーネント全体（手動で画面確認する方が早い）
- Layout / UI 部品

---

## ディレクトリ構成

テストコードはテスト対象と **colocate**（同階層に `.test.ts[x]`）する。

```text
src/
  components/
    features/
      cast-selector/
        cast-selector.tsx
        cast-selector.test.tsx      ← 追加
  lib/
    actions/
      combos.ts
    validators/                      ← Phase 2 で追加
      combo.ts
      combo.test.ts
  test/
    setup.ts                         ← jest-dom 拡張、共通モック
```

理由: 公開側（`(public)` ルートグループ）・管理画面の切替でパスが変わっても追従しやすい。

---

## セットアップ手順

### 1. 依存追加

```bash
npm i -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @vitest/ui
```

### 2. `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

### 3. `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

### 4. `package.json` スクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

### 5. `tsconfig.json` 調整

`types` に `vitest/globals` を追加（`globals: true` を使う場合）。

---

## Supabase モック方針（将来の Phase 2 以降）

Server Action のテストを行う際は、`src/lib/supabase/server.ts` をモック：

```ts
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    // ...必要に応じて
  }),
}));
```

ただし連鎖メソッドのモックは壊れやすいため、**validator を抽出してそちらを単体テストする方が費用対効果が高い**。

---

## CI（将来）

GitHub Actions で `npm run test:run` を PR トリガーで回す。
現時点では導入せず、ローカルで `npm test` を watch モードで使う運用から始める。

---

## フェーズ計画

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **1** | Vitest セットアップ + cast-selector テスト | セットアップ一式、`cast-selector.test.tsx` |
| **2** | `parseFormData` / `parseMembers` を `lib/validators/` に抽出 + テスト | validators 配下のテスト群 |
| **3** | CI ワークフロー追加 | `.github/workflows/test.yml` |
| **4**（任意） | Server Action 結合テスト | Supabase モック戦略確立後 |
