import { readFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const peHomeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/pe/PEHome.tsx"),
  "utf8",
);

describe("Professional Effectiveness welcome heading", () => {
  it("uses restrained text sizing and weight", () => {
    expect(peHomeSource).toContain(
      'className="text-lg md:text-xl font-semibold text-white leading-snug"',
    );
    expect(peHomeSource).not.toContain('className="text-2xl md:text-3xl font-bold text-white"');
  });
});

describe("Professional Effectiveness brief refresh", () => {
  it("marks manual refreshes explicitly and updates the cached daily brief", () => {
    expect(peHomeSource).toContain('generateBrief.mutate({ refresh: true });');
    expect(peHomeSource).toContain('utils.pei.getTodayBriefSnapshot.setData(undefined, data);');
    expect(peHomeSource).toContain('toast.error("Could not refresh your daily brief. Please try again.");');
  });
});
