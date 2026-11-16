import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

/** Shared per-request lookup for profile rendering and generateMetadata. */
export const getInstructorProfile = cache(async (id: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await createServiceClient()
    .from("instructors")
    .select("id, full_name, bio, avatar_url, teaching_locations, is_claimed, avg_overall, avg_value, avg_effectiveness, avg_punctuality, total_reviews, reviews_visible, is_test, is_active, opted_out_at, created_at")
    .eq("id", id).is("opted_out_at", null).maybeSingle();
  if (error) throw new Error("Unable to load instructor profile.");
  return data;
});
