import { describe, expect, it } from "vitest";
import {
  buildWhatsappNumber,
  isValidWhatsappNumber,
  splitWhatsappNumber,
  whatsappHref,
} from "./whatsapp";

describe("WhatsApp helpers", () => {
  it("builds an E.164-style number from a country code and local input", () => {
    expect(buildWhatsappNumber("+91", "98765 43210")).toBe("+919876543210");
  });

  it("avoids duplicating the selected country code", () => {
    expect(buildWhatsappNumber("+44", "+44 7700 900123")).toBe("+447700900123");
  });

  it("splits a stored number for editing", () => {
    expect(splitWhatsappNumber("+919876543210")).toEqual({ dialCode: "+91", localNumber: "9876543210" });
  });

  it("validates realistic WhatsApp digit lengths and creates a safe link", () => {
    expect(isValidWhatsappNumber("+919876543210")).toBe(true);
    expect(isValidWhatsappNumber("12345")).toBe(false);
    expect(whatsappHref("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });
});
