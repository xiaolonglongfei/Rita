"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface InstructorProfile {
  id: string;
  full_name: string;
}

interface NavbarProps {
  initialUser: User | null;
  instructorProfile?: InstructorProfile | null;
  pendingCount?: number;
}

export default function Navbar({
  initialUser,
  instructorProfile = null,
  pendingCount = 0,
}: NavbarProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close drawer on route change (user tapped a link)
  function closeMobile() {
    setMobileOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "My Account";

  // ── Shared nav link style for mobile drawer ───────────────────────────────
  // Each mobile link gets min 44px height and full-width tap target.
  const mobileLinkClass =
    "flex items-center px-6 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors";
  const mobileLinkStyle = { minHeight: 52 };

  return (
    <nav className="border-b border-slate-100 bg-white relative z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-rita-charcoal" onClick={closeMobile}>
            Rovi<span className="text-rita-lime">.</span>
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-6">
            {user && instructorProfile ? (
              /* ── Instructor nav ── */
              <>
                <Link
                  href={`/instructors/${instructorProfile.id}`}
                  className="text-sm text-rita-gray hover:text-rita-charcoal transition-colors"
                >
                  My Profile
                </Link>
                <Link
                  href="/sessions"
                  className="relative text-sm text-rita-gray hover:text-rita-charcoal transition-colors"
                >
                  My Sessions
                  {pendingCount > 0 && (
                    <span
                      className="absolute -top-2 -right-4 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                      style={{ background: "#f97316" }}
                    >
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              /* ── Student / guest nav ── */
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Right: auth controls + hamburger */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-slate-400 max-w-[140px] truncate">
                {displayName}
              </span>
              {!instructorProfile && (
                <Link
                  href="/profile"
                  className="hidden sm:block text-sm text-rita-gray hover:text-rita-charcoal"
                >
                  Profile
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="hidden sm:block text-sm bg-slate-100 text-rita-charcoal px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Sign Out
              </button>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="sm:hidden flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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

      {/* ── Mobile nav drawer ──────────────────────────────────────────────
           Visible only on < sm when mobileOpen = true.
           Each link is min 52px tall — well above the 44px touch-target floor. */}
      {mobileOpen && user && (
        <div className="sm:hidden border-t border-slate-100 bg-white pb-3">
          <div className="flex flex-col">
            {/* Display name */}
            <div className="px-6 py-3 text-xs text-slate-400 border-b border-slate-50">
              {displayName}
            </div>

            {user && instructorProfile ? (
              /* ── Instructor mobile nav ── */
              <>
                <Link
                  href={`/instructors/${instructorProfile.id}`}
                  className={mobileLinkClass}
                  style={mobileLinkStyle}
                  onClick={closeMobile}
                >
                  My Profile
                </Link>
                <Link
                  href="/sessions"
                  className={mobileLinkClass}
                  style={mobileLinkStyle}
                  onClick={closeMobile}
                >
                  My Sessions
                  {pendingCount > 0 && (
                    <span
                      className="ml-2 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                      style={{ background: "#f97316" }}
                    >
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              /* ── Student mobile nav ── */
              <>
                <Link
                  href="/instructors"
                  className={mobileLinkClass}
                  style={mobileLinkStyle}
                  onClick={closeMobile}
                >
                  Instructors
                </Link>
                <Link
                  href="/ranking"
                  className={mobileLinkClass}
                  style={mobileLinkStyle}
                  onClick={closeMobile}
                >
                  My Ranking
                </Link>
                <Link
                  href="/sessions"
                  className={mobileLinkClass}
                  style={mobileLinkStyle}
                  onClick={closeMobile}
                >
                  My Sessions
                </Link>
                <Link
                  href="/reviews/new"
                  className={mobileLinkClass}
                  style={mobileLinkStyle}
                  onClick={closeMobile}
                >
                  Write Review
                </Link>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100 mt-1 mb-1" />

            {/* Profile + Sign Out */}
            {!instructorProfile && (
              <Link
                href="/profile"
                className={mobileLinkClass}
                style={mobileLinkStyle}
                onClick={closeMobile}
              >
                Profile
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center px-6 text-base font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
              style={mobileLinkStyle}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
