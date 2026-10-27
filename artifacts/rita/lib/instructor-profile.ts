import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

/** Shared per-request lookup for profile rendering and generateMetadata. */
export const getInstructorProfile = cache(async (id: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await createServiceClient()
    .from("instructors").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load instructor profile.");
  return data;
});
