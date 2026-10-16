import { describe, expect, it } from "vitest";
import { publicName } from "@/lib/leaderboard-name";

describe("publicName", () => {
  it("shows first name and last initial only", () => {
    expect(
      publicName({
        name: "Ajito Nelson Lucio da Costa",
        email: "a@example.com",
      }),
    ).toBe("Ajito C.");
    expect(
      publicName({ name: "Jedinilda Serafines", email: "js@example.com" }),
    ).toBe("Jedinilda S.");
  });
  it("keeps single names as-is", () => {
    expect(publicName({ name: "Eco", email: "team@example.com" })).toBe("Eco");
  });
  it("never exposes an email or an email-derived name", () => {
    expect(
      publicName({ name: "nelsonajito", email: "nelsonajito123@gmail.com" }),
    ).toBe("Recycler");
    expect(publicName({ name: "someone@mail.com", email: "x@y.com" })).toBe(
      "Recycler",
    );
    expect(publicName({ name: "", email: "x@y.com" })).toBe("Recycler");
  });
});
