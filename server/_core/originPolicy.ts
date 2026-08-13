const PRODUCTION_ORIGINS = [
  "https://levelnext.coach",
  "https://www.levelnext.coach",
  "https://levelnextai-m9hb5g5z.manus.space",
];

const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export function isAllowedCorsOrigin(origin: string | undefined, nodeEnv: string | undefined): boolean {
  if (!origin || PRODUCTION_ORIGINS.includes(origin)) return true;
  if (DEV_ORIGINS.includes(origin)) return nodeEnv !== "production";
  if (nodeEnv === "production") return false;

  try {
    const previewUrl = new URL(origin);
    return previewUrl.protocol === "https:" && (
      previewUrl.hostname.endsWith(".manus.computer") ||
      previewUrl.hostname.endsWith(".manus.space")
    );
  } catch {
    return false;
  }
}
