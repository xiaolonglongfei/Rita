import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getGiveawayProgress } from "@/lib/giveaway-progress";

export const dynamic = "force-dynamic";
export const metadata = { title: "Giveaway entries", robots: { index: false, follow: false } };
const PAGE_SIZE = 50;

export default async function GiveawayAdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const db = createServiceClient();
  const { data: account, error: roleError } = await db.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (roleError) throw new Error("Unable to check administrator access.");
  if (account?.is_admin !== true) redirect("/");

  const params = await searchParams;
  const parsed = Number(params.page ?? "1");
  const page = Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 1;
  const { data: entries, count, error: entryError } = await db.from("giveaway_free_entries")
    .select("id, full_name, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (entryError || count == null) throw new Error("Unable to load free giveaway entries.");

  let reviewers = 0;
  const now = new Date();
  // Reuse the exact existing qualification helper, without storing/recomputing entry awards.
  for (let offset = 0; ; offset += 1000) {
    const { data: users, error } = await db.from("users").select("id")
      .not("giveaway_opt_in_at", "is", null).order("id").range(offset, offset + 999);
    if (error || !users) throw new Error("Unable to count qualifying reviewers.");
    for (let i = 0; i < users.length; i += 20) {
      const progress = await Promise.all(users.slice(i, i + 20).map((profile) => getGiveawayProgress(profile.id, now)));
      reviewers += progress.filter((item) => item.qualifyingReviewCount > 0).length;
    }
    if (users.length < 1000) break;
  }

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Giveaway entries</h1>
      <p className="mt-3 text-sm text-slate-600">
        At drawing time, include each free entry as one equally weighted entry alongside the existing review-entry pool and eligible email entries.
        This page is read only and does not run a drawing or change existing entries.
      </p>
      <div className="my-6 flex flex-wrap gap-4">
        <p className="rounded-xl border bg-white p-4"><strong>{count}</strong> free entries</p>
        <p className="rounded-xl border bg-white p-4"><strong>{reviewers}</strong> users with at least one qualifying review</p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Free giveaway entries, read only</caption>
          <thead className="bg-slate-50"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Created at (UTC)</th></tr></thead>
          <tbody>
            {(entries ?? []).map((entry) => <tr key={entry.id} className="border-t">
              <td className="p-3">{entry.full_name}</td><td className="p-3">{entry.email}</td>
              <td className="whitespace-nowrap p-3"><time dateTime={entry.created_at}>{new Date(entry.created_at).toISOString()}</time></td>
            </tr>)}
            {!entries?.length && <tr><td colSpan={3} className="p-6 text-center text-slate-500">No free entries on this page.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Free entry pages" className="mt-4 flex gap-4 text-sm text-orange-600">
        {page > 1 && <Link href={`/admin/giveaway?page=${page - 1}`} className="underline">Previous</Link>}
        {page * PAGE_SIZE < count && <Link href={`/admin/giveaway?page=${page + 1}`} className="underline">Next</Link>}
      </nav>
    </section>
  );
}
