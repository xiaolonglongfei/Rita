import { supabase } from "@workspace/db";

type RelatedNotification = {
  message: string;
  related_instructor_id?: string | number | null;
  related_review_id?: string | number | null;
};

/** Hide linked records and older name-only messages without deleting history. */
export async function visibleNotifications<T extends RelatedNotification>(records: T[]): Promise<T[]> {
  const removed: { id: string; full_name: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("instructors").select("id, full_name")
      .not("opted_out_at", "is", null).order("id").range(offset, offset + 999);
    if (error) throw new Error("Unable to load notification visibility.");
    removed.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const ids = new Set<string | number>(removed.map(coach => coach.id));
  const reviewIds = records.flatMap(n => n.related_review_id ? [n.related_review_id] : []);
  const { data: reviews, error } = reviewIds.length
    ? await supabase.from("reviews").select("id, instructor_id").in("id", reviewIds)
    : { data: [], error: null };
  if (error) throw new Error("Unable to load notification visibility.");
  const related = (reviews ?? []) as { id: string | number; instructor_id: string | number }[];
  const hiddenReviews = new Set<string | number>(related
    .filter(review => ids.has(review.instructor_id)).map(review => review.id));
  return records.filter(n => !ids.has(n.related_instructor_id ?? "") &&
    !hiddenReviews.has(n.related_review_id ?? "") &&
    !removed.some(coach => coach.full_name && n.message.toLowerCase().includes(coach.full_name.toLowerCase())));
}
