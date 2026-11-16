type BioSourceValues = { bio_source_url?: string | null; bio_source_checked_at?: string | null };

export function parseBioSource(body: Record<string, unknown>): { values: BioSourceValues } | { error: string } {
  const values: BioSourceValues = {};
  if (Object.prototype.hasOwnProperty.call(body, "bio_source_url")) {
    if (body.bio_source_url !== null && typeof body.bio_source_url !== "string") {
      return { error: "Please enter a valid bio source URL, or leave it blank." };
    }
    const url = typeof body.bio_source_url === "string" ? body.bio_source_url.trim() : "";
    if (url) {
      try {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol) || url.length > 2048) throw new Error("Invalid URL");
      } catch {
        return { error: "Please enter a complete http:// or https:// bio source URL." };
      }
    }
    values.bio_source_url = url || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "bio_source_checked_at")) {
    if (body.bio_source_checked_at !== null && typeof body.bio_source_checked_at !== "string") {
      return { error: "Please enter a valid date for Bio source checked on, or leave it blank." };
    }
    const date = typeof body.bio_source_checked_at === "string" ? body.bio_source_checked_at.trim() : "";
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)) {
      return { error: "Please enter a valid date for Bio source checked on." };
    }
    values.bio_source_checked_at = date || null;
  }
  return { values };
}
