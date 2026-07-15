import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AddInstructorForm } from "@/components/instructor/AddInstructorForm";

export default async function NewInstructorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/instructors/new");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <a
          href="/instructors"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          ← Back to search
        </a>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Add an Instructor</h1>
          <p className="text-sm text-slate-500 mt-1">Help grow Rovi&apos;s instructor database</p>
        </div>

        <AddInstructorForm />
      </div>
    </div>
  );
}
