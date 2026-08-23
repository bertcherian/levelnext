/** Returns a latest result only when one actually exists. */
export function getMostRecentMepDiagnostic<T>(results: readonly T[] | null | undefined): T | null {
  return results?.[0] ?? null;
}
