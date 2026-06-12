import Link from "next/link";

export default function HomePage() {
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
            className="text-sm bg-rita-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-rita-blue-dark transition-colors"
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
          <span className="text-rita-blue underline decoration-rita-lime decoration-4 underline-offset-4">
            you or your child
          </span>
          .
        </h1>
        <p className="text-lg text-rita-gray max-w-2xl mx-auto mb-10">
          Real reviews from real students in Westchester County — honest,
          anonymous, and verified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/instructors"
            className="bg-rita-blue text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-rita-blue-dark transition-colors"
          >
            Browse Instructors →
          </Link>
          <Link
            href="/signup"
            className="bg-rita-charcoal text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-slate-700 transition-colors"
          >
            Write a Review
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-3 gap-8 text-center">
          {[
            { label: "Instructors", value: "10+" },
            { label: "Verified Reviews", value: "12" },
            { label: "Dimensions Rated", value: "3" },
          ].map((stat) => (
            <div key={stat.label} className="bg-rita-gray-light rounded-2xl p-6">
              <div className="text-3xl font-extrabold text-rita-blue mb-1">{stat.value}</div>
              <div className="text-sm text-rita-gray">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
