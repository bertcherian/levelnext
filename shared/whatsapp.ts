export const WHATSAPP_COUNTRY_CODES = [
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "NL", name: "Netherlands", dialCode: "+31" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
] as const;

export const DEFAULT_WHATSAPP_COUNTRY_CODE = "+91";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function buildWhatsappNumber(dialCode: string, localNumber: string) {
  const dialDigits = digitsOnly(dialCode);
  let localDigits = digitsOnly(localNumber);
  if (dialDigits && localDigits.startsWith(dialDigits) && localDigits.length > dialDigits.length + 6) {
    localDigits = localDigits.slice(dialDigits.length);
  }
  if (!dialDigits || localDigits.length < 7) return "";
  return `+${dialDigits}${localDigits}`;
}

export function splitWhatsappNumber(value?: string | null) {
  const digits = digitsOnly(value ?? "");
  if (!digits) return { dialCode: DEFAULT_WHATSAPP_COUNTRY_CODE, localNumber: "" };
  const match = WHATSAPP_COUNTRY_CODES.find((country) => digits.startsWith(digitsOnly(country.dialCode)));
  if (!match) return { dialCode: "+", localNumber: digits };
  return { dialCode: match.dialCode, localNumber: digits.slice(digitsOnly(match.dialCode).length) };
}

export function whatsappHref(value?: string | null) {
  const digits = digitsOnly(value ?? "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function isValidWhatsappNumber(value: string) {
  const digits = digitsOnly(value);
  return digits.length >= 10 && digits.length <= 15;
}
