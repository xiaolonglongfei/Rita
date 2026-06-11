import { Layout } from "@/components/layout";
import { useListInstructors } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Search, MapPin, Star } from "lucide-react";

export default function Instructors() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const { data, isLoading } = useListInstructors({ search, location });

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary">Scout Instructors</h1>
            <p className="text-muted-foreground mt-2 font-medium">Find and vet top-tier coaches based on real athlete data.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-3 bg-background border rounded-lg font-medium focus:ring-2 focus:ring-accent outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-64">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <select
              className="w-full pl-10 pr-4 py-3 bg-background border rounded-lg font-medium appearance-none focus:ring-2 focus:ring-accent outline-none transition-all"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="Scarsdale">Scarsdale, NY</option>
              <option value="White Plains">White Plains, NY</option>
              <option value="Rye">Rye, NY</option>
              <option value="Harrison">Harrison, NY</option>
              <option value="Mamaroneck">Mamaroneck, NY</option>
              <option value="Bronxville">Bronxville, NY</option>
              <option value="Larchmont">Larchmont, NY</option>
              <option value="New Rochelle">New Rochelle, NY</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-bold tracking-widest uppercase">Scanning Database...</div>
        ) : (
          <div className="grid gap-4">
            {data?.items.map(instructor => (
              <Link key={instructor.id} href={`/instructors/${instructor.id}`} className="group block bg-card rounded-xl border shadow-sm hover:shadow-md hover:border-accent/50 transition-all overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center font-black text-2xl text-muted-foreground overflow-hidden">
                      {instructor.photoUrl ? (
                        <img src={instructor.photoUrl} alt={instructor.name} className="w-full h-full object-cover" />
                      ) : (
                        instructor.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black flex items-center gap-2 group-hover:text-accent transition-colors">
                        {instructor.name}
                        {instructor.claimed ? (
                          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">✓ Claimed</span>
                        ) : (
                          <span className="text-xs font-semibold bg-muted text-muted-foreground border px-2 py-0.5 rounded-full">Unclaimed</span>
                        )}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-sm font-medium text-muted-foreground">
                        <span className="text-foreground">{instructor.specialty}</span>
                        {instructor.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {instructor.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0">
                    <ScoreBadge score={instructor.avgScore} />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">{instructor.reviewCount} Reviews</span>
                  </div>
                </div>
              </Link>
            ))}
            {data?.items.length === 0 && (
              <div className="text-center py-20 border border-dashed rounded-xl bg-card">
                <div className="text-muted-foreground font-bold tracking-widest uppercase">No Instructors Found</div>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ScoreBadge({ score }: { score: number }) {
  let color = "bg-gray-100 text-gray-800 border-gray-200";
  if (score >= 4.0) color = "bg-blue-50 text-blue-700 border-blue-200";
  else if (score >= 2.5) color = "bg-amber-50 text-amber-700 border-amber-200";
  else color = "bg-red-50 text-red-700 border-red-200";

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-lg ${color}`}>
      <Star size={16} className={score >= 4.0 ? "fill-blue-700" : score >= 2.5 ? "fill-amber-700" : "fill-red-700"} />
      {score.toFixed(1)}
    </div>
  );
}
