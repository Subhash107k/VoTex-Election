import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApiUrl } from "./apiClient.ts";

describe("buildApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured API base URL for relative API requests", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3001");
    expect(buildApiUrl("/api/auth/login")).toBe(
      "http://localhost:3001/api/auth/login",
    );
  });

  it("keeps absolute URLs unchanged", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3001");
    expect(buildApiUrl("https://example.com/api/auth/me")).toBe(
      "https://example.com/api/auth/me",
    );
  });
});
