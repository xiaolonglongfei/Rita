import { createClient, createServiceClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  MessageSquareText,
  TrendingUp,
  UsersRound,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = createServiceClient();

  let instructorProfile: { id: string; full_name: string } | null = null;
  let pendingCount = 0;

  if (user) {
    const { data: profile } = await db
      .from("instructors")
      .select("id, full_name")
      .eq("claimed_by", user.id)
      .single();

    if (profile) {
      instructorProfile = profile as { id: string; full_name: string };

      const { count } = await db
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", profile.id)
        .eq("is_verified", false)
        .eq("moderation_status", "approved");

      pendingCount = count ?? 0;
    }
  }

  const [{ count: instructorCount }, { count: reviewCount }] = await Promise.all([
    db.from("instructors").select("*", { count: "exact", head: true }).eq("is_test", false).eq("is_active", true),
    db
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "approved"),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        initialUser={user}
        instructorProfile={instructorProfile}
        pendingCount={pendingCount}
      />

      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-rita-lime-light text-rita-lime-dark text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          🎾 Find Your Perfect Coach
        </div>
        <h1 className="text-5xl font-extrabold text-rita-charcoal leading-tight mb-6">
          Find the right tennis<br />
          instructor for{" "}
          <span
            className="underline decoration-rita-lime decoration-4 underline-offset-4"
            style={{ color: "#f97316" }}
          >
            you or your child
          </span>
          .
        </h1>
        <p className="text-lg text-rita-gray max-w-2xl mx-auto mb-10">
          Real reviews from real students — honest, anonymous, and verified.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <a
            href="/instructors"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-bold text-base"
            style={{ background: "#f97316" }}
          >
            Browse Instructors →
          </a>
          <a
            href="/instructor-info"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-base border-2"
            style={{ borderColor: "#1e2a38", color: "#1e2a38", background: "transparent" }}
          >
            I&apos;m an Instructor
          </a>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/instructors" className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md">
            <UsersRound aria-hidden="true" className="mb-3 h-8 w-8 text-orange-500" strokeWidth={2} />
            <div className="text-3xl font-extrabold" style={{ color: "#f97316" }}>
              {instructorCount ?? 0}
            </div>
            <div className="text-sm text-slate-500 mt-1">Instructors</div>
          </a>

          <a href="/instructors" className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md">
            <MessageSquareText aria-hidden="true" className="mb-3 h-8 w-8 text-orange-500" strokeWidth={2} />
            <div className="text-3xl font-extrabold" style={{ color: "#f97316" }}>
              {reviewCount ?? 0}
            </div>
            <div className="text-sm text-slate-500 mt-1">Reviews</div>
          </a>

          <div className="flex h-full flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm">
            <ChartNoAxesCombined aria-hidden="true" className="mb-3 h-8 w-8 text-orange-500" strokeWidth={2} />
            <div className="text-base font-extrabold mb-4" style={{ color: "#f97316" }}>
              Rated on
            </div>
            <div className="flex w-full max-w-44 flex-col items-center gap-3">
              {[
                { Icon: CircleDollarSign, label: "Value" },
                { Icon: TrendingUp, label: "Effectiveness" },
                { Icon: Clock3, label: "Punctuality" },
              ].map(({ Icon, label }) => (
                <div key={label} className="inline-flex items-center justify-center gap-3">
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-500" strokeWidth={2} />
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
