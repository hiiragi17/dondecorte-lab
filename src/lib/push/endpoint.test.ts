import { describe, expect, it } from "vitest";
import { isAllowedPushEndpoint } from "./endpoint";

describe("isAllowedPushEndpoint", () => {
  it("主要ブラウザのプッシュサービスは許可する", () => {
    expect(
      isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")
    ).toBe(true);
    expect(
      isAllowedPushEndpoint(
        "https://updates.push.services.mozilla.com/wpush/v2/abc"
      )
    ).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(
      isAllowedPushEndpoint("https://abc.notify.windows.com/w/?token=xyz")
    ).toBe(true);
  });

  it("https 以外のスキームは拒否する", () => {
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc")).toBe(
      false
    );
  });

  it("許可リスト外のホストは拒否する", () => {
    expect(isAllowedPushEndpoint("https://attacker.example.com/abc")).toBe(
      false
    );
    expect(isAllowedPushEndpoint("https://169.254.169.254/latest/meta-data")).toBe(
      false
    );
    expect(isAllowedPushEndpoint("https://localhost/abc")).toBe(false);
  });

  it("許可ホストを末尾に含む偽装ホストは拒否する", () => {
    expect(
      isAllowedPushEndpoint("https://fcm.googleapis.com.attacker.example/abc")
    ).toBe(false);
  });

  it("URL として不正な文字列は拒否する", () => {
    expect(isAllowedPushEndpoint("not a url")).toBe(false);
    expect(isAllowedPushEndpoint("")).toBe(false);
  });
});
