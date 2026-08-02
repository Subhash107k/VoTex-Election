import { describe, expect, it } from "vitest";
import { Database } from "./dbService";

describe("database seed data", () => {
  it("seeds realistic admin and voter accounts", () => {
    const users = Database.getUsers();

    const admin = users.find((user) => user.role === "Administrator");
    const voter = users.find((user) => user.role === "Voter");

    expect(admin).toBeDefined();
    expect(admin?.email).toBe("admin@votex.gov");
    expect(admin?.address).toContain("Kathmandu");
    expect(admin?.isEmailVerified).toBe(true);
    expect(admin?.isMobileVerified).toBe(true);
    expect(admin?.profilePicture).toBeDefined();

    expect(voter).toBeDefined();
    expect(voter?.email).toBe("voter@votex.gov");
    expect(voter?.address).toContain("Lalitpur");
    expect(voter?.isEmailVerified).toBe(true);
    expect(voter?.isMobileVerified).toBe(true);
    expect(voter?.profilePicture).toBeDefined();
  });
});
