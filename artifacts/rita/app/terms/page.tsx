import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Rovi",
  description: "Terms governing the use of Rovi and rovi.training.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
        <Link
          href="/"
          className="inline-block text-2xl font-black tracking-tight text-slate-800 hover:opacity-80"
          data-testid="link-rovi-home"
        >
          Rovi<span className="text-[#b8d400]">.</span>
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-7">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl" data-testid="terms-title">
            Rovi Terms of Service
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 9/20/2026</p>
        </header>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-slate-700 sm:text-base">
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By creating a Rovi account or using rovi.training (&quot;Rovi,&quot; &quot;we,&quot; &quot;us&quot;), you agree to these Terms of Service and our{" "}
              <Link href="/privacy" className="text-orange-600 underline underline-offset-2">
                Privacy Policy
              </Link>
              . If you do not agree, do not use Rovi.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">2. Description of the Service</h2>
            <p>
              Rovi is a platform where students and parents can leave anonymous, verified reviews of private tennis instructors in Westchester County, NY, and browse other users&apos; reviews to help choose an instructor.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">3. Eligibility</h2>
            <p>
              You must be at least 13 years old to create a Rovi account. If you are between 13 and 17, you represent that you have your parent or guardian&apos;s permission to use Rovi and to agree to these Terms on your own behalf.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">4. Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information when creating your account. One account per person; do not create multiple accounts to circumvent Rovi&apos;s review or promotional limits.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">5. Reviews and User Content</h2>
            <p>
              When you submit a review or other content (&quot;User Content&quot;), you retain ownership of it, but you grant Rovi a worldwide, royalty-free, non-exclusive license to host, display, reproduce, and distribute that content on Rovi in connection with operating the service. Reviews must reflect your own genuine experience with the instructor in question; Rovi verifies that a review is tied to a real session between the reviewer and instructor accounts, but does not verify the truth of the opinions expressed within a review.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">6. Content You May Not Post</h2>
            <p>
              You agree not to submit content that: contains another person&apos;s personal contact information (phone numbers, emails, addresses, social media handles); is obscene, threatening, hateful, or discriminatory; is knowingly false; infringes someone else&apos;s rights; or otherwise violates the law or Rovi&apos;s content guidelines. Rovi uses automated screening and may remove content, at its discretion, that violates this section.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">7. No Endorsement; Reviews Are Opinions</h2>
            <p>
              Reviews published on Rovi are the personal opinions of the individual reviewers, not statements made or endorsed by Rovi. Rovi does not guarantee the accuracy, completeness, or reliability of any review, and is not responsible for decisions made in reliance on reviews published on the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">8. Reporting a Review / Instructor Dispute Process</h2>
            <p>
              If you are an instructor (or another individual) who believes a review about you is false, violates Section 6, or should otherwise be removed, you may submit a request to{" "}
              <a href="mailto:rovi.training.support@gmail.com" className="text-orange-600 underline underline-offset-2">
                rovi.training.support@gmail.com
              </a>{" "}
              describing the review and the basis for your request. Rovi will review the request in good faith and may remove or retain the content at its discretion. Submitting a dispute does not guarantee removal.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">9. Rovi&apos;s Role as a Platform</h2>
            <p>
              Rovi provides tools for users to publish their own content; Rovi does not create, write, or verify the substance of User Content, and to the fullest extent permitted by law, is not treated as the publisher or speaker of any User Content posted by users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">10. Intellectual Property</h2>
            <p>
              Rovi&apos;s name, logo, design, and underlying software are the property of Rovi and may not be copied or used without permission. This does not apply to User Content, which remains owned by the user who posted it, subject to the license in Section 5.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">11. Termination</h2>
            <p>
              Rovi may suspend or terminate your account at any time, with or without notice, for violating these Terms or for any conduct Rovi believes is harmful to the platform, its users, or third parties. You may stop using Rovi and request account deletion at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">12. Disclaimers</h2>
            <p>
              Rovi is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">13. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Rovi and its operator will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, arising from your use of Rovi or reliance on any content published on it. Rovi&apos;s total liability for any claim arising from these Terms or your use of the service will not exceed $100.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">14. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Rovi and its operator from any claims, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising from your User Content, your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of New York, without regard to conflict-of-law principles. Any dispute arising from these Terms or your use of Rovi will be brought exclusively in the state or federal courts located in New York.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">16. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we will update the &quot;Last updated&quot; date above. Continued use of Rovi after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">17. Contact</h2>
            <p>
              Questions about these Terms can be sent to{" "}
              <a href="mailto:rovi.training.support@gmail.com" className="text-orange-600 underline underline-offset-2">
                rovi.training.support@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
            data-testid="link-back-to-main-site"
          >
            Back to Rovi
          </Link>
        </div>
      </article>
    </main>
  );
}