import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="inline-block text-2xl font-bold text-slate-800">
        Rovi<span className="text-rita-lime">.</span>
      </Link>
      <section className="py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900">404 — Page not found</h1>
        <p className="mt-4 text-slate-600">This page could not be found.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-orange-600 underline underline-offset-2">
          Back to home
        </Link>
      </section>
    </main>
  );
}
