import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export interface DirectoryInstructor {
  id: string;
  name: string;
  location: string | null;
  claimed: boolean;
  avgScore: number | null;
  reviewCount: number;
}

export async function getInitialInstructorPage(): Promise<{ items: DirectoryInstructor[]; total: number }> {
  const { data, count, error } = await createServiceClient().from("instructors")
    .select("id, full_name, teaching_locations, is_claimed, reviews_visible, avg_overall, total_reviews", { count: "exact" })
    .eq("is_test", false).eq("is_active", true)
    .order("full_name", { ascending: true }).range(0, 49);
  if (error) throw new Error("Unable to load instructor directory.");
  return {
    items: (data ?? []).map((instructor) => ({
      id: instructor.id,
      name: instructor.full_name,
      location: instructor.teaching_locations,
      claimed: instructor.is_claimed,
      // Only this safe DTO crosses the server/client boundary, not the raw row.
      avgScore: instructor.reviews_visible === true ? instructor.avg_overall : null,
      reviewCount: instructor.total_reviews,
    })),
    total: count ?? 0,
  };
}
