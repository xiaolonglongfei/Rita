import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

export interface Club {
  slug: string;
  name: string;
  city: string;
  state: string;
  region: string;
  teaching_location: string;
  is_live: boolean;
}

export interface ClubCoach {
  id: string;
  full_name: string;
  bio: string | null;
  teaching_locations: string | null;
}

export const getLiveClub = cache(async (slug: string): Promise<Club | null> => {
  const { data, error } = await createServiceClient().from("clubs")
    .select("slug, name, city, state, region, teaching_location, is_live")
    .eq("slug", slug).eq("is_live", true).maybeSingle();
  if (error) throw new Error("Unable to load club.");
  return data;
});

export async function getClubCoaches(teachingLocation: string): Promise<ClubCoach[]> {
  const db = createServiceClient();
  const coaches: ClubCoach[] = [];
  const escapedLocation = teachingLocation.replace(/[\\%_]/g, "\\$&");
  // Page through all candidates rather than silently stopping at PostgREST's limit.
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db.from("instructors")
      .select("id, full_name, bio, teaching_locations")
      .eq("is_active", true).eq("is_test", false)
      .ilike("teaching_locations", `%${escapedLocation}%`)
      .order("full_name", { ascending: true }).order("id", { ascending: true })
      .range(start, start + 999);
    if (error) throw new Error("Unable to load club coaches.");
    const rows: ClubCoach[] = data ?? [];
    coaches.push(...rows.filter((coach) => coach.teaching_locations
      ?.split(" · ").some((segment) => segment.trim() === teachingLocation.trim())));
    if (rows.length < 1000) break;
  }
  return coaches;
}
