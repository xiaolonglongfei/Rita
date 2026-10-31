import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white px-4 py-6">
      <nav aria-label="Policies" className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
        <Link href="/terms" className="hover:underline">Terms</Link>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <Link href="/guidelines" className="hover:underline">Review guidelines</Link>
      </nav>
    </footer>
  );
}
