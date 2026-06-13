"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Search, ChevronDown } from "lucide-react";

const WESTCHESTER_LOCATIONS = [
  "Scarsdale",
  "White Plains",
  "Rye",
  "Harrison",
  "Mamaroneck",
  "Bronxville",
  "Larchmont",
  "New Rochelle",
  "Tarrytown",
  "Pound Ridge",
  "Bedford",
];

type Instructor = {
  id: string;
  name: string;
  location: string | null;
  claimed: boolean;
  avgScore: number | null;
  reviewCount: number;
};

function scoreColor(s: number) {
  if (s >= 4.0) return "#f97316";
  if (s >= 2.5) return "#c89000";
  return "#c83030";
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    fetch(`/api/instructors?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setInstructors(d.items ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, [search, location]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Find a Tennis Instructor</h1>
        <p className="text-sm text-slate-500 mt-1">Browse verified instructors in Westchester County</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rita-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rita-primary bg-white text-slate-700"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {WESTCHESTER_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
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
                className="flex items-center gap-4 p-5 border border-slate-100 rounded-2xl hover:border-rita-primary hover:shadow-sm transition-all bg-white"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: "#f97316" }}
                >
                  {i.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-rita-charcoal">{i.name}</span>
                    {i.claimed && (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}
                      >
                        ✓ Claimed
                      </span>
                    )}
                  </div>
                  {i.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {i.location}
                    </p>
                  )}
                </div>
                {i.reviewCount > 0 && i.avgScore != null ? (
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-xl font-extrabold"
                      style={{ color: scoreColor(i.avgScore) }}
                    >
                      {i.avgScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400">
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
