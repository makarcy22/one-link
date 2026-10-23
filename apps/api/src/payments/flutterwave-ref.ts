/** Reference format: ol-<plan>-<userId>-<timestamp>. Parsed again by the webhook. */
export function makeTxRef(plan: string, userId: string, now = Date.now()): string {
  return `ol-${plan}-${userId}-${now}`;
}
export function parseTxRef(ref: string): { plan: string; userId: string } | null {
  const parts = ref.split("-");
  if (parts.length < 4 || parts[0] !== "ol") return null;
  const plan = parts[1];
  const userId = parts.slice(2, -1).join("-");
  return plan && userId ? { plan, userId } : null;
}

