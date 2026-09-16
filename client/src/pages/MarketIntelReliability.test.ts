import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Market Intel reliability boundaries", () => {
  it("includes Opportunities auxiliary queries in its retry boundary", () => {
    const source = read("client/src/pages/CareerAccess.tsx");
    expect(source).toContain("isError: briefingHistoryError");
    expect(source).toContain("isError: scoreImprovementError");
    expect(source).toContain("briefingHistoryError || scoreImprovementError");
    expect(source).toContain("void refetchBriefingHistory()");
    expect(source).toContain("void refetchScoreImprovement()");
  });

  it("gives Opportunity Radar an explicit retry path", () => {
    const source = read("client/src/pages/RadarSignals.tsx");
    expect(source).toContain("isError, refetch");
    expect(source).toContain("QueryErrorState");
    expect(source).toContain("Opportunity Radar couldn't be loaded");
    expect(source).toContain("void refetch()");
  });

  it("distinguishes Relationship Graph loading and query failures from an empty contact list", () => {
    const source = read("client/src/pages/RelationshipGraph.tsx");
    expect(source).toContain("isLoading, isError, refetch");
    expect(source).toContain("Your relationships couldn't be loaded");
    expect(source).toContain("<Skeleton className=\"h-8 w-64 rounded-lg\" />");
    expect(source).toContain("void refetch()");
  });

  it("provides independent retry paths for brand strategy, drafts, and contacts", () => {
    const source = read("client/src/pages/OutreachEngine.tsx");
    expect(source).toContain("isError, refetch");
    expect(source).toContain("Brand strategy couldn't be loaded");
    expect(source).toContain("isError: draftsError, refetch: refetchDrafts");
    expect(source).toContain("isError: contactsError, refetch: refetchContacts");
    expect(source).toContain("void refetchDrafts()");
    expect(source).toContain("void refetchContacts()");
    expect(source).toContain("contactsLoading");
  });

  it("optimistically removes drafts and restores them when deletion fails", () => {
    const source = read("client/src/pages/OutreachEngine.tsx");
    expect(source).toContain("onMutate: async ({ id })");
    expect(source).toContain("listOutreachDrafts.cancel()");
    expect(source).toContain("listOutreachDrafts.setData(undefined, (current) => current?.filter");
    expect(source).toContain("previousDrafts");
    expect(source).toContain("listOutreachDrafts.invalidate()");
    expect(source).toContain("disabled={deleteMutation.isPending}");
  });

  it("persists and restores the selected Market Intel tab through the URL", () => {
    const source = read("client/src/pages/career/CareerMarketIntel.tsx");
    expect(source).toContain("tabFromSearch");
    expect(source).toContain("new URLSearchParams");
    expect(source).toContain("navigate(`/career/market-intel${query ? `?${query}` : \"\"}`, { replace: true })");
    expect(source).toContain("aria-selected={activeTab === key}");
  });
});
