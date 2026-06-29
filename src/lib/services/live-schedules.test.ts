import { describe, expect, it } from "vitest";
import { parseLiveSchedules } from "./live-schedules";

function fd(entries: Record<string, string[]>): FormData {
  const f = new FormData();
  for (const [key, values] of Object.entries(entries)) {
    for (const v of values) f.append(key, v);
  }
  return f;
}

describe("parseLiveSchedules", () => {
  it("有効な行を LiveScheduleInput に変換する", () => {
    const form = fd({
      schedule_phase: ["lottery", "sale"],
      schedule_label: ["一次抽選", ""],
      schedule_start: ["2026-06-01", "2026-06-10"],
      schedule_end: ["2026-06-05", ""],
      schedule_time: ["", "23:59"],
      schedule_url: ["https://l.example", ""],
    });
    const { schedules, error } = parseLiveSchedules(form);
    expect(error).toBeUndefined();
    expect(schedules).toEqual([
      {
        phase_type: "lottery",
        label: "一次抽選",
        start_date: "2026-06-01",
        end_date: "2026-06-05",
        start_time: null,
        url: "https://l.example",
        sort_order: 0,
      },
      {
        phase_type: "sale",
        label: null,
        start_date: "2026-06-10",
        end_date: null,
        start_time: "2026-06-10T23:59:00",
        url: null,
        sort_order: 1,
      },
    ]);
  });

  it("開始日が空の行はスキップする", () => {
    const form = fd({
      schedule_phase: ["lottery"],
      schedule_start: [""],
    });
    const { schedules, error } = parseLiveSchedules(form);
    expect(error).toBeUndefined();
    expect(schedules).toEqual([]);
  });

  it("種別が不正ならエラーを返す", () => {
    const form = fd({
      schedule_phase: ["invalid"],
      schedule_start: ["2026-06-01"],
    });
    const { error } = parseLiveSchedules(form);
    expect(error).toBe("スケジュールの種別が不正です");
  });

  it("開始日が不正な形式ならエラーを返す", () => {
    const form = fd({
      schedule_phase: ["lottery"],
      schedule_start: ["2026/06/01"],
    });
    const { error } = parseLiveSchedules(form);
    expect(error).toBe("スケジュールの開始日が不正です");
  });

  it("終了日が開始日より前ならエラーを返す", () => {
    const form = fd({
      schedule_phase: ["sale"],
      schedule_start: ["2026-06-10"],
      schedule_end: ["2026-06-01"],
    });
    const { error } = parseLiveSchedules(form);
    expect(error).toBe("スケジュールの終了日は開始日以降にしてください");
  });
});
