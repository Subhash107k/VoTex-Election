import { describe, expect, it } from "vitest";
import {
  buildMailFromAddress,
  normalizeVerificationCode,
} from "./auth.controller.js";

describe("auth helpers", () => {
  it("normalizes verification codes by trimming whitespace", () => {
    expect(normalizeVerificationCode(" 123456 ")).toBe("123456");
    expect(normalizeVerificationCode("\n654321\t")).toBe("654321");
  });

  it("builds a display name for the sender when SMTP_FROM_NAME is configured", () => {
    expect(buildMailFromAddress("noreply@votex.com", "Votex")).toBe(
      "Votex <noreply@votex.com>",
    );
  });
});
