import "server-only";
import { createHash } from "node:crypto";

export function normalizeFreeEntryEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split("@");
  return domain === "gmail.com" ? `${local.split("+")[0].replace(/\./g, "")}@gmail.com` : normalized;
}

// All server instances use the same primary key for an email's next entry slot.
// Concurrent requests cannot insert two entries after reading the same count.
// No existing records are updated, deleted, or assigned new identifiers.
export function freeEntrySlotId(emailKey: string, promotionStart: string, slot: number) {
  const hash = createHash("sha256").update(JSON.stringify(["rovi-free-entry", promotionStart, emailKey, slot])).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function createFreeEntryIpLimiter() {
  const buckets = new Map<string, { count: number; resetsAt: number }>();
  return (ip: string, now: number, limit: number, windowMs: number) => {
    const key = createHash("sha256").update(ip).digest("hex");
    for (const [storedKey, bucket] of buckets) {
      if (bucket.resetsAt <= now) buckets.delete(storedKey);
    }
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      return bucket.count <= limit ? 0 : Math.ceil((bucket.resetsAt - now) / 1000);
    }
    // Bound memory even if requests arrive with many different addresses.
    if (buckets.size >= 50_000) return Math.ceil(windowMs / 1000);
    buckets.set(key, { count: 1, resetsAt: now + windowMs });
    return 0;
  };
}
