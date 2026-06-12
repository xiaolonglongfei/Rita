"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<unknown[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      fetch("/api/reviews").then((r) => r.json()).then(setReviews);
    });
  }, [supabase, router]);

  if (!user) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold text-rita-charcoal mb-8">My Profile</h1>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rita-blue-light flex items-center justify-center text-rita-blue font-bold text-xl">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-rita-charcoal">
              {user.user_metadata?.full_name ?? user.email}
            </div>
            <div className="text-sm text-rita-gray">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6">
        <h2 className="font-bold text-rita-charcoal mb-4">My Reviews ({Array.isArray(reviews) ? reviews.length : 0})</h2>
        {Array.isArray(reviews) && reviews.length === 0 ? (
          <p className="text-sm text-rita-gray">You haven&apos;t written any reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {Array.isArray(reviews) && reviews.map((r: unknown) => {
              const rev = r as { id: number; instructorName: string | null; overallScore: number; status: string; createdAt: string };
              return (
                <div key={rev.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-rita-charcoal">{rev.instructorName ?? "Unknown"}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-rita-blue">{rev.overallScore.toFixed(1)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rev.status === "approved" ? "bg-green-100 text-green-700" :
                      rev.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {rev.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
