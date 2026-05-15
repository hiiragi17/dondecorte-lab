import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

import { middleware } from "./middleware";

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${path}`));
}

beforeEach(() => {
  getUserMock.mockReset();
});

describe("middleware の認証ガード", () => {
  it("未認証で /admin にアクセスすると /auth/login にリダイレクトされる", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/login"
    );
  });

  it("未認証で /admin 配下のサブパスにアクセスすると /auth/login にリダイレクトされる", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/admin/videos/new"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/login"
    );
  });

  it("認証済みなら /admin/* を通過する", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });

    const response = await middleware(makeRequest("/admin/videos"));

    // NextResponse.next() はリダイレクトを返さない
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("公開ページ（/videos）は未認証でもガード対象外", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/videos"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("公開ページ（トップ /）は未認証でもガード対象外", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("認証済みで /auth/login にアクセスすると /admin にリダイレクトされる", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });

    const response = await middleware(makeRequest("/auth/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin");
  });

  it("未認証で /auth/login にアクセスするとそのまま通過する", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/auth/login"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
