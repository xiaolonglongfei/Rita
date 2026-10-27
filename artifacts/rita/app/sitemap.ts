import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["/", "/instructors", "/rules", "/terms", "/privacy"]
    .map((path) => ({ url: siteUrl(path) }));
  // PostgREST can cap a response at 1,000 rows; paginate so no eligible profile
  // silently disappears as the directory grows.
  const db = createServiceClient();
  const batchSize = 1000;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await db.from("instructors")
      .select("id, updated_at")
      .eq("is_active", true).eq("is_test", false).eq("reviews_visible", true)
      .order("id", { ascending: true }).range(offset, offset + batchSize - 1);
    if (error) throw new Error("Unable to generate instructor sitemap.");
    for (const instructor of data ?? []) {
      pages.push({
        url: siteUrl(`/instructors/${instructor.id}`),
        ...(instructor.updated_at ? { lastModified: instructor.updated_at } : {}),
      });
    }
    if ((data?.length ?? 0) < batchSize) break;
  }
  return pages;
}
