export function getMainModuleSignature(html: string) {
  const matches = html.match(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi) ?? [];
  for (const tag of matches) {
    const match = /\bsrc=["']([^"']+)["']/i.exec(tag);
    const source = match?.[1];
    if (source && /\/assets\/[^/]+\.js(?:\?|$)/.test(source)) return source;
  }
  return null;
}

export function isNewBuildAvailable(currentSignature: string | null, nextSignature: string | null) {
  return Boolean(currentSignature && nextSignature && currentSignature !== nextSignature);
}
