export default function InstructorInfoPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-lg mx-auto">

        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">

          <div className="text-5xl mb-4">🎾</div>

          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            Join Rovi as an Instructor
          </h1>

          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Rovi is currently in early access in Westchester County, NY.
            We are personally onboarding instructors to ensure the quality
            and integrity of every profile on our platform.
          </p>

          <div className="text-left flex flex-col gap-5 mb-8">

            <div className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "#f97316" }}
              >
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Search for your profile
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your profile may already exist on Rovi.
                  Search your name in the instructor directory.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "#f97316" }}
              >
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Contact us to claim your profile
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Email us at{" "}
                  <a
                    href="mailto:hello@rovi.training"
                    className="font-semibold"
                    style={{ color: "#f97316" }}
                  >
                    hello@rovi.training
                  </a>
                  {" "}with your name and the club you teach at.
                  We will verify your identity and activate your profile.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "#f97316" }}
              >
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Start receiving verified reviews
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Once activated, students can verify sessions with you
                  and you will be notified of new review requests.
                </p>
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/instructors"
              className="w-full py-3 rounded-xl text-white font-bold text-sm text-center"
              style={{ background: "#f97316" }}
            >
              Search for My Profile →
            </a>
            <a
              href="mailto:hello@rovi.training"
              className="w-full py-3 rounded-xl font-semibold text-sm text-center border border-slate-200 text-slate-600"
            >
              Contact Us to Join
            </a>
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-slate-600 mt-1"
            >
              ← Back to homepage
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
