import { describe, expect, it, vi } from "vitest";

import { createHttpClient } from "../src/http";
import { MemoryTokenStorage } from "../src/storage";

describe("createHttpClient refresh flow", () => {
  it("refreshes token and retries once when request returns 401", async () => {
    const storage = new MemoryTokenStorage();
    await storage.setTokens("old-access", "old-refresh");

    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "new-access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));

    const http = createHttpClient({
      baseUrl: "http://localhost:8000",
      storage,
      fetcher,
    });

    const payload = await http.request<{ status: string }>("/protected");

    expect(payload).toEqual({ status: "ok" });
    expect(fetcher).toHaveBeenCalledTimes(3);

    const accessToken = await storage.getAccessToken();
    const refreshToken = await storage.getRefreshToken();

    expect(accessToken).toBe("new-access");
    expect(refreshToken).toBe("old-refresh");
  });

  it("clears tokens and throws UNAUTHENTICATED when refresh fails", async () => {
    const storage = new MemoryTokenStorage();
    await storage.setTokens("old-access", "old-refresh");

    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "invalid refresh" }), { status: 401 }));

    const http = createHttpClient({
      baseUrl: "http://localhost:8000",
      storage,
      fetcher,
    });

    await expect(http.request("/protected")).rejects.toThrowError("UNAUTHENTICATED");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(await storage.getAccessToken()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
  });
});
