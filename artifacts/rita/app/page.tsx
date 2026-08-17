import { createClient, createServiceClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";

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

        {/*
          Outer grid:
          - 1 col on phone (< 640 px) — all three cards stack
          - 2 cols at 640 px+ — Instructors | Reviews on row 1,
            "Rated on" spans both columns on row 2 (always has room for its inner items)
          No 3-col tier: a narrow third column would cramp the inner dimension labels.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mt-10 px-4">
          <a href="/instructors" className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="text-4xl mb-3">🎾</div>
            <div className="text-3xl font-extrabold" style={{ color: "#f97316" }}>
              {instructorCount ?? 0}
            </div>
            <div className="text-sm text-slate-500 mt-1">Instructors</div>
          </a>

          <a href="/instructors" className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="text-4xl mb-3">⭐</div>
            <div className="text-3xl font-extrabold" style={{ color: "#f97316" }}>
              {reviewCount ?? 0}
            </div>
            <div className="text-sm text-slate-500 mt-1">Reviews</div>
          </a>

          {/*
            "Rated on" always spans both columns at sm+, giving the inner items
            plenty of horizontal room at every breakpoint (≥ 360 px content area).
            gap-x-8 (32 px) guarantees clear separation between the three labels.
          */}
          <div className="sm:col-span-2 bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-base font-extrabold mb-4" style={{ color: "#f97316" }}>
              Rated on
            </div>
            <div className="flex justify-center gap-x-8 gap-y-2 flex-wrap">
              {[
                { emoji: "💰", label: "Value" },
                { emoji: "📈", label: "Effectiveness" },
                { emoji: "⏰", label: "Punctuality" },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="text-xs text-slate-500 font-medium text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
