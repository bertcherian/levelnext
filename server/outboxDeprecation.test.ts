import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Intelligence Core outbox deprecation", () => {
  it("does not register a scheduled publisher endpoint", () => {
    const serverEntry = source("./_core/index.ts");
    const scheduledHandlers = source("./scheduledHandlers.ts");

    expect(serverEntry).not.toContain("icOutboxPublisherHandler");
    expect(serverEntry).not.toContain("/api/scheduled/icOutboxPublisher");
    expect(scheduledHandlers).not.toContain("icOutboxPublisherHandler");
    expect(scheduledHandlers).not.toContain("icOutboxEvents");
  });

  it("keeps outbox history without producing new no-consumer events", () => {
    const intelligenceCore = source("./routers/intelligenceCore.ts");
    const intelligenceCoreHelpers = source("./routers/intelligenceCoreHelpers.ts");

    expect(intelligenceCore).not.toContain("writeOutboxEvent");
    expect(intelligenceCore).not.toContain("icOutboxEvents");
    expect(intelligenceCoreHelpers).not.toContain("icOutboxEvents");
  });
});
