import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions, corrections, or concerns about Rovi? Contact our support team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 sm:p-10">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Contact us</h1>
        <p className="leading-relaxed text-slate-600">
          Questions, corrections, or concerns about Rovi? Email us at{" "}
          <a href="mailto:rovi.training.support@gmail.com" className="break-words text-orange-600 underline underline-offset-2">
            rovi.training.support@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
