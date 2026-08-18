export function resolveMepDailyBriefTimeZone(timeZone?: string): string {
  if (!timeZone) return "UTC";

  try {
    Intl.DateTimeFormat("en-CA", { timeZone }).format();
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function getMepDailyBriefDateKey(date = new Date(), timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveMepDailyBriefTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type === "year" || part.type === "month" || part.type === "day")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getBrowserTimeZone(): string {
  return resolveMepDailyBriefTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}
