"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, CheckCircle2, Search } from "lucide-react";

type Instructor = {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  location: string | null;
  claimed: boolean;
  avgScore: number;
  reviewCount: number;
};

function scoreColor(s: number) {
  if (s >= 4.5) return "#1668c8";
  if (s >= 3.5) return "#c89000";
  return "#c83030";
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "20" });
    if (search) params.set("search", search);
    fetch(`/api/instructors?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setInstructors(d.items ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, [search]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-rita-charcoal mb-2">Scout Instructors</h1>
        <p className="text-rita-gray">Find and vet top-tier coaches based on real athlete data.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rita-blue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-rita-gray mb-4">{total} instructors</p>
          <div className="space-y-3">
            {instructors.map((i) => (
              <Link
                key={i.id}
                href={`/instructors/${i.id}`}
                className="flex items-center gap-4 p-5 border border-slate-100 rounded-2xl hover:border-rita-blue hover:shadow-sm transition-all bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-rita-blue-light flex items-center justify-center text-rita-blue font-bold text-lg flex-shrink-0">
                  {i.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-rita-charcoal">{i.name}</span>
                    {i.claimed && (
                      <span className="inline-flex items-center gap-1 text-xs text-rita-blue bg-rita-blue-light px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Claimed
                      </span>
                    )}
                  </div>
                  {i.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {i.location}
                    </p>
                  )}
                </div>
                {i.reviewCount > 0 ? (
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-xl font-extrabold"
                      style={{ color: scoreColor(i.avgScore) }}
                    >
                      {i.avgScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-end gap-0.5">
                      <Star className="h-3 w-3" />
                      {i.reviewCount} {i.reviewCount === 1 ? "review" : "reviews"}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 flex-shrink-0">No reviews yet</div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
