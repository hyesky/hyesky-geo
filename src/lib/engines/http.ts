export function formatProviderError(provider: string, status: number, body: string) {
  const snippet = body.replace(/\s+/g, " ").slice(0, 280);
  return `${provider} request failed (${status}): ${snippet || "no response body"}`;
}
