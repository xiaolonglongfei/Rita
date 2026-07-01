import Link from "next/link";
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
    db.from("instructors").select("*", { count: "exact", head: true }),
    db
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "approved"),
  ]);

  const stats = [
    { label: "Instructors", value: String(instructorCount ?? 0) },
    { label: "Reviews", value: String(reviewCount ?? 0) },
    { label: "Dimensions Rated", value: "3" },
  ];

  // "I'm an Instructor" smart redirect
  const instructorHref = user
    ? instructorProfile
      ? "/sessions"
      : "/claim-profile"
    : "/signup?role=instructor";

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        initialUser={user}
        instructorProfile={instructorProfile}
        pendingCount={pendingCount}
      />

      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-rita-lime-light text-rita-lime-dark text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          🎾 Now serving Westchester County, NY
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
          Real reviews from real students in Westchester County — honest,
          anonymous, and verified.
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
            href={instructorHref}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-base border-2"
            style={{ borderColor: "#1e2a38", color: "#1e2a38", background: "transparent" }}
          >
            I&apos;m an Instructor
          </a>
        </div>

        <div className="mt-24 grid grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-rita-gray-light rounded-2xl p-6">
              <div className="text-3xl font-extrabold mb-1" style={{ color: "#f97316" }}>
                {stat.value}
              </div>
              <div className="text-sm text-rita-gray">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
