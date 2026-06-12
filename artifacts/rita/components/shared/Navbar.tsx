"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-slate-100 px-6 py-4 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-rita-charcoal">
            Rita<span className="text-rita-lime">.</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/instructors" className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors">
              Instructors
            </Link>
            <Link href="/ranking" className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors">
              Rankings
            </Link>
            {user && (
              <>
                <Link href="/sessions" className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors">
                  My Sessions
                </Link>
                <Link href="/reviews/new" className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors">
                  Write Review
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="text-sm text-rita-gray hover:text-rita-charcoal">
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm bg-slate-100 text-rita-charcoal px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-rita-gray hover:text-rita-charcoal">
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-rita-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-rita-blue-dark transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
