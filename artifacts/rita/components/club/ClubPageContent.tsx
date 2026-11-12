import { MapPin, ShieldCheck } from "lucide-react";
import type { Club, ClubCoach } from "@/lib/club-pages";
import { plainTextBio } from "@/lib/instructor-seo";

export function ClubPageContent({ club, coaches }: { club: Club; coaches: ClubCoach[] }) {
  const mailto = `mailto:rovi.training.support@gmail.com?subject=${encodeURIComponent(`Club page: ${club.name}`)}`;

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-6 mb-8 sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="max-w-5xl mx-auto min-w-0 break-words">
          <h1 className="text-2xl font-bold text-slate-800">{club.name}</h1>
          <p className="inline-flex items-center gap-2 mt-2 text-sm text-slate-600">
            <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" />
            {club.city}, NY
          </p>
          <p className="mt-3 text-sm text-slate-700">Tennis coaches at this club on Rovi.</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            This is an independent page created from the club&apos;s public website. Rovi is not affiliated with or endorsed by this club.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8 flex flex-col gap-8">
        {/* Rating block */}
        <section className="rounded-xl p-5 sm:p-6 border" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
          <p className="text-sm font-semibold text-slate-800">
            Taken a lesson with one of these coaches? Leave an honest rating. It takes about a minute.
          </p>
          <p className="flex items-start gap-2 mt-3 text-xs text-slate-600">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" />
            <span>Your rating and comments stay anonymous. Names are never shown with reviews or ratings.</span>
          </p>
          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
            Adults 18 and over who leave a rating for a coach they have had a lesson with could win a $100 racket gift card. Free to enter.{" "}
            <a href="/rules" className="font-semibold underline underline-offset-2" style={{ color: "#c2410c" }}>
              Official rules
            </a>
          </p>
          <a
            href={`/win?club=${encodeURIComponent(club.slug)}`}
            className="mt-4 inline-flex w-full sm:w-auto justify-center text-sm font-semibold px-5 py-2.5 rounded-lg text-white"
            style={{ background: "#f97316" }}
          >
            Enter the giveaway
          </a>
        </section>

        {/* Coach list */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Coaches</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coaches.map((coach) => {
              const bio = plainTextBio(coach.bio).slice(0, 140);
              return (
                <li key={coach.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                    style={{ background: "#f97316" }}
                    aria-hidden="true"
                  >
                    {coach.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 break-words">
                    <a href={`/instructors/${coach.id}`} className="text-base font-bold text-slate-800 hover:underline">
                      {coach.full_name}
                    </a>
                    {bio && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{bio}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-xs text-slate-500 border-t border-slate-100 pt-6">
          <a href={mailto} className="underline underline-offset-2 hover:text-slate-700">
            Are you with this club? Ask us to correct or remove this page
          </a>
        </p>
      </div>
    </div>
  );
}
