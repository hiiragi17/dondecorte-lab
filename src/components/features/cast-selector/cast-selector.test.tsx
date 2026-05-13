import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CastSelector } from "./cast-selector";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";

const artists: ArtistSummary[] = [
  { id: "artist-1", name: "渡辺銀次", kana_name: "わたなべぎんじ" },
  { id: "artist-2", name: "小橋共作", kana_name: "こばしともさく" },
  { id: "artist-3", name: "別人", kana_name: "べつじん" },
];

const combos: ComboSummary[] = [
  { id: "combo-1", name: "ドンデコルテ", kana_name: "どんでこるて" },
  { id: "combo-2", name: "別のコンビ", kana_name: "べつのこんび" },
];

const units: UnitSummary[] = [
  { id: "unit-1", name: "テストユニット" },
  { id: "unit-2", name: "別のユニット" },
];

type HarnessProps = {
  initial?: CastEntry[];
  onChangeSpy?: (entries: CastEntry[]) => void;
};

function Harness({ initial = [], onChangeSpy }: HarnessProps) {
  const [value, setValue] = useState<CastEntry[]>(initial);
  return (
    <CastSelector
      artists={artists}
      combos={combos}
      units={units}
      value={value}
      onChange={(entries) => {
        onChangeSpy?.(entries);
        setValue(entries);
      }}
    />
  );
}

const getTargetSelect = () =>
  screen.getByLabelText("追加対象") as HTMLSelectElement;

describe("CastSelector", () => {
  it("初期表示ではコンビタブがアクティブで、コンビが選択肢に並ぶ", () => {
    render(<Harness />);

    const comboTab = screen.getByRole("button", { name: "コンビ" });
    expect(comboTab).toHaveAttribute("aria-pressed", "true");

    const select = getTargetSelect();
    expect(
      within(select).getByRole("option", { name: /ドンデコルテ/ })
    ).toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: /別のコンビ/ })
    ).toBeInTheDocument();
    expect(
      within(select).queryByRole("option", { name: /渡辺銀次/ })
    ).not.toBeInTheDocument();
  });

  it("芸人タブに切り替えると芸人一覧が表示される", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "芸人" }));

    expect(screen.getByRole("button", { name: "芸人" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const select = getTargetSelect();
    expect(
      within(select).getByRole("option", { name: /渡辺銀次/ })
    ).toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: /小橋共作/ })
    ).toBeInTheDocument();
    expect(
      within(select).queryByRole("option", { name: /ドンデコルテ/ })
    ).not.toBeInTheDocument();
  });

  it("ユニットタブに切り替えるとユニット一覧が表示される", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "ユニット" }));

    const select = getTargetSelect();
    expect(
      within(select).getByRole("option", { name: /テストユニット/ })
    ).toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: /別のユニット/ })
    ).toBeInTheDocument();
  });

  it("検索ボックスへの入力で名前による絞り込みができる", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "芸人" }));
    await user.type(screen.getByLabelText("名前で検索"), "渡辺");

    const select = getTargetSelect();
    expect(
      within(select).getByRole("option", { name: /渡辺銀次/ })
    ).toBeInTheDocument();
    expect(
      within(select).queryByRole("option", { name: /小橋共作/ })
    ).not.toBeInTheDocument();
  });

  it("検索はカナ名にもマッチする", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "芸人" }));
    await user.type(screen.getByLabelText("名前で検索"), "こばし");

    const select = getTargetSelect();
    expect(
      within(select).getByRole("option", { name: /小橋共作/ })
    ).toBeInTheDocument();
    expect(
      within(select).queryByRole("option", { name: /渡辺銀次/ })
    ).not.toBeInTheDocument();
  });

  it("対象を選択して追加すると onChange に CastEntry が渡される", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);

    await user.click(screen.getByRole("button", { name: "芸人" }));
    await user.selectOptions(getTargetSelect(), "artist-1");
    await user.click(screen.getByRole("button", { name: "出演者を追加" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      { type: "artist", id: "artist-1", name: "渡辺銀次" },
    ]);
  });

  it("追加した出演者は選択タグとして表示される", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "芸人" }));
    await user.selectOptions(getTargetSelect(), "artist-1");
    await user.click(screen.getByRole("button", { name: "出演者を追加" }));

    const tag = screen.getByText("渡辺銀次").closest("li");
    expect(tag).not.toBeNull();
    expect(within(tag as HTMLElement).getByText("個人")).toBeInTheDocument();
  });

  it("追加済みの対象は選択肢から除外される", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[{ type: "artist", id: "artist-1", name: "渡辺銀次" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: "芸人" }));

    const select = getTargetSelect();
    expect(
      within(select).queryByRole("option", { name: /渡辺銀次/ })
    ).not.toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: /小橋共作/ })
    ).toBeInTheDocument();
  });

  it("選択タグの解除ボタンで onChange から除外される", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initial={[
          { type: "artist", id: "artist-1", name: "渡辺銀次" },
          { type: "comedy_group", id: "combo-1", name: "ドンデコルテ" },
        ]}
        onChangeSpy={onChange}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "渡辺銀次 を解除" })
    );

    expect(onChange).toHaveBeenCalledWith([
      { type: "comedy_group", id: "combo-1", name: "ドンデコルテ" },
    ]);
  });

  it("対象未選択のまま追加するとエラーが表示される", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);

    await user.click(screen.getByRole("button", { name: "出演者を追加" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "追加する対象を選択してください"
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("タブを切り替えると検索キーワードと選択中の値がリセットされる", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "芸人" }));
    const search = screen.getByLabelText("名前で検索") as HTMLInputElement;
    await user.type(search, "渡辺");
    await user.selectOptions(getTargetSelect(), "artist-1");

    await user.click(screen.getByRole("button", { name: "ユニット" }));

    expect(search.value).toBe("");
    expect(getTargetSelect().value).toBe("");
  });
});
