import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Sales Intelligence seller workspace", () => {
  const page = readFileSync("client/src/pages/SalesIntelligence.tsx", "utf8");

  it("shows the truth map, next move, and commitment reflection loop", () => {
    expect(page).toContain("What we know");
    expect(page).toContain("What we are assuming");
    expect(page).toContain("Next best move");
    expect(page).toContain("Act → Reflect → Learn");
  });

  it("states the private seller boundary", () => {
    expect(page).toContain("Development is not performance surveillance.");
  });
});
