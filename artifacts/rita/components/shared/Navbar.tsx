"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  initialUser: User | null;
}

export default function Navbar({ initialUser }: NavbarProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const supabase = createClient();

  useEffect(() => {
    // Sync any client-side auth changes (login on another tab, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="border-b border-slate-100 px-6 py-4 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-rita-charcoal">
            Rita<span className="text-rita-lime">.</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/instructors"
              className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors"
            >
              Instructors
            </Link>
            {user && (
              <>
                <Link
                  href="/ranking"
                  className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors"
                >
                  My Ranking
                </Link>
                <Link
                  href="/sessions"
                  className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors"
                >
                  My Sessions
                </Link>
                <Link
                  href="/reviews/new"
                  className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors"
                >
                  Write Review
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-slate-400 max-w-[140px] truncate">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "My Account"}
              </span>
              <Link
                href="/profile"
                className="text-sm text-rita-gray hover:text-rita-charcoal"
              >
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
              <Link
                href="/login"
                className="text-sm text-rita-gray hover:text-rita-charcoal"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ background: "#f97316" }}
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
