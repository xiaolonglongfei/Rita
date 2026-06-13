import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServiceClient();

  const [{ count: instructorCount }, { count: reviewCount }] = await Promise.all([
    supabase.from("instructors").select("*", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "approved"),
  ]);

  const stats = [
    { label: "Instructors", value: String(instructorCount ?? 0) },
    { label: "Reviews", value: String(reviewCount ?? 0) },
    { label: "Dimensions Rated", value: "3" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-rita-charcoal">
            Rita<span className="text-rita-lime">.</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/instructors" className="text-sm text-rita-gray hover:text-rita-charcoal">
            Instructors
          </Link>
          <Link href="/ranking" className="text-sm text-rita-gray hover:text-rita-charcoal">
            Rankings
          </Link>
          <Link href="/login" className="text-sm text-rita-gray hover:text-rita-charcoal">
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-rita-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-rita-primary-dark transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </nav>

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
            href="/signup?role=instructor"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-base border-2"
            style={{ borderColor: "#1e2a38", color: "#1e2a38", background: "transparent" }}
          >
            I'm an Instructor
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
