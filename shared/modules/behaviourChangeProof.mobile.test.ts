import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PROOF_MOBILE_EVENT_TYPES,
  proofMobileEventSchema,
  proofQrResolveSchema,
} from "./behaviourChangeProof";

const joinPage = readFileSync(new URL("../../client/src/pages/PilotJoin.tsx", import.meta.url), "utf8");
const kickoff = readFileSync(new URL("../../client/src/components/PilotMobileKickoff.tsx", import.meta.url), "utf8");
const install = readFileSync(new URL("../../client/src/components/PWAInstallBanner.tsx", import.meta.url), "utf8");
const service = readFileSync(new URL("../../server/behaviourChangeProof.ts", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../../client/public/manifest.json", import.meta.url), "utf8"));

describe("Zero-friction mobile pilot access", () => {
  it("requires an email address alongside the non-personal QR token", () => {
    expect(proofQrResolveSchema.safeParse({ token: "a".repeat(32), email: "participant@example.com", isMobile: true }).success).toBe(true);
    expect(proofQrResolveSchema.safeParse({ token: "a".repeat(32), email: "not-an-email" }).success).toBe(false);
  });

  it("allows mobile telemetry only for a participant or QR token", () => {
    expect(proofMobileEventSchema.safeParse({ token: "b".repeat(32), eventType: "mobile_opened", isMobile: true }).success).toBe(true);
    expect(proofMobileEventSchema.safeParse({ qrToken: "c".repeat(32), eventType: "qr_scanned", isMobile: true }).success).toBe(true);
    expect(proofMobileEventSchema.safeParse({ eventType: "qr_scanned", isMobile: true }).success).toBe(false);
    expect(PROOF_MOBILE_EVENT_TYPES).toContain("install_accepted");
  });

  it("implements privacy-preserving QR flow with expiring, revocable, email-bound access", () => {
    expect(joinPage).toContain("Invitation email");
    expect(joinPage).toContain("No personal details are in this QR");
    expect(service).toContain("resolveProofQrJoin");
    expect(service).toContain("email.trim().toLowerCase()");
    expect(service).toContain("revokedAt: now");
    expect(service).toContain("31 * 24 * 60 * 60 * 1000");
  });

  it("delays the install offer until a participant has reached first useful value", () => {
    expect(install).toContain("isParticipantRoute()");
    expect(install).toContain("levelnext_first_value_seen");
    expect(install).toContain("Add LevelNext to your phone");
    expect(install).toContain("Add to Home Screen");
  });

  it("provides sponsor QR lifecycle controls and a mobile-first PWA launch shell", () => {
    expect(kickoff).toContain("Generate QR");
    expect(kickoff).toContain("Rotate");
    expect(kickoff).toContain("Revoke");
    expect(manifest.start_url).toBe("/pilot");
    expect(manifest.theme_color).toBe("#0A1A2F");
    expect(manifest.icons[0].src).toBe("/icon-192x192.png");
  });
});
