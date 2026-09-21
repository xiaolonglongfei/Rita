import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Rovi",
  description: "Learn what information Rovi collects, how it is used, and the choices available to you.",
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl" data-testid="privacy-title">
            Rovi Privacy Policy
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 9/20/2026</p>
        </header>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-slate-700 sm:text-base">
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">1. Overview</h2>
            <p>
              Rovi (rovi.training) is a free platform where students and parents can leave anonymous, verified reviews of private tennis instructors in Westchester County, NY. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using Rovi, you agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">2. Information We Collect</h2>
            <div className="space-y-3">
              <p><strong className="text-slate-900">Account information:</strong> When you create a Rovi account, we collect your email address and a password (stored securely by our authentication provider; we never see or store your password in plain text).</p>
              <p><strong className="text-slate-900">Review content:</strong> The text and ratings (Value, Effectiveness, Punctuality) you submit about an instructor.</p>
              <p><strong className="text-slate-900">Session verification data:</strong> Information used to confirm that a review is tied to an actual lesson (mutual session verification between student and instructor accounts).</p>
              <p><strong className="text-slate-900">Giveaway participation:</strong> If you sign up through a promotional giveaway, we record the timestamp of your opt-in and, where applicable, which reviews qualify you for bonus entries.</p>
              <p><strong className="text-slate-900">Usage data:</strong> Basic, aggregated site usage analytics (pages visited, general traffic patterns) collected through our hosting provider&apos;s analytics tool. This does not identify you individually.</p>
              <p><strong className="text-slate-900">Communications:</strong> If you contact us, we keep a record of that correspondence to respond to you.</p>
              <p>We do not knowingly collect payment information, government ID numbers, or other sensitive identifiers — Rovi does not require any of these to use the service.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information above to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Operate the core service — creating and displaying instructor ratings, verifying sessions, and enforcing our review-quality safeguards (including automated content screening for things like personal information, contact details, or inappropriate language)</li>
              <li>Send you account-related emails (welcome messages, session verification requests, password resets) and, if applicable, giveaway-related notifications</li>
              <li>Maintain the integrity and safety of the platform (for example, investigating suspected abuse, spam, or policy violations)</li>
              <li>Improve the product based on aggregate usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">4. Anonymity of Reviews</h2>
            <p>
              Reviews on Rovi are anonymous: your identity is never shown to the instructor you reviewed or to other members of the public, and an instructor&apos;s individual review count and scores are only made visible once enough reviews have accumulated, specifically to make it harder to guess who wrote any single review. Internally, our systems retain a link between your account and the reviews you&apos;ve submitted — this is necessary to verify sessions, prevent abuse, and operate features like the giveaway — but this internal record is never disclosed publicly or to instructors.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">5. How We Share Information</h2>
            <p>
              We do not sell your personal information. We share information only with the service providers that help us operate Rovi (for example, our database, email delivery, and hosting providers), each of whom is only permitted to use your information to provide services to us, and, where required, to comply with the law or protect the rights, safety, or property of Rovi, our users, or others.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">6. Data Retention</h2>
            <p>
              We retain account and review data for as long as your account is active, or as needed to operate the service (for example, to preserve an instructor&apos;s review history). You may request deletion of your account and associated personal information at any time by contacting us; some information may be retained where necessary for legal, safety, or record-keeping purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">7. Cookies &amp; Analytics</h2>
            <p>
              Rovi uses lightweight, privacy-conscious website analytics to understand overall traffic patterns. This does not involve third-party advertising cookies, and Rovi does not use your data for targeted advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">8. Children&apos;s Privacy</h2>
            <p>
              Rovi is intended for use by parents, guardians, and students who are old enough to independently consent to our Terms of Service. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has created an account or submitted information to Rovi, please contact us so we can remove it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">9. Your Choices &amp; Rights</h2>
            <p>
              You may access, correct, or request deletion of your personal information at any time by contacting us. If you are a California resident, you may have additional rights under California privacy law, including the right to know what personal information we hold about you and to request its deletion; you can exercise these rights using the same contact method.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">10. Data Security</h2>
            <p>
              We use reasonable technical and organizational measures to protect your information, including secure, industry-standard authentication and access controls. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will update the &quot;Last updated&quot; date above. Continued use of Rovi after changes take effect constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">12. Contact Us</h2>
            <p>
              Questions about this Privacy Policy or your information can be sent to{" "}
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