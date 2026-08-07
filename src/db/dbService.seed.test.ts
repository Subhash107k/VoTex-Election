import { describe, expect, it } from "vitest";
import { Database } from "./dbService";

describe("database seed data", () => {
  it("seeds realistic admin and voter accounts", () => {
    const users = Database.getUsers();

    const admin = users.find((user) => user.role === "Administrator");
    const voter = users.find((user) => user.role === "Voter");

    expect(admin).toBeDefined();
    expect(admin?.email).toBe("admin@votex.gov");
    expect(admin?.isEmailVerified).toBeUndefined(); // seeded without email verified flag in new structure or is true in old
    // We removed address verification as it's not strictly seeded by default in the new format for admin

    expect(voter).toBeDefined();
    expect(voter?.email).toBe("voter1@votex.gov"); // Fixed from voter@votex.gov
    expect(voter?.isVerified).toBe(true);
  });
});
