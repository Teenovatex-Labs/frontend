import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | TeenovateX Labs",
  description: "The rules for using TeenovateX Labs.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="wrap max-w-[720px] py-14">
        <p className="eyebrow text-rose">Legal</p>
        <h1 className="mt-2 text-[38px] leading-[1.1] tracking-[-0.03em] md:text-[48px]">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted">Last updated: September 29, 2026</p>

        <div className="mt-6 rounded-md border border-ink bg-pink/20 p-4 text-sm">
          <strong>This is a draft, not legal advice.</strong> It covers the basics honestly, but a lawyer should
          review it &mdash; particularly the age/eligibility and liability sections &mdash; before it&rsquo;s the
          real terms people agree to.
        </div>

        <div className="mt-8 flex flex-col gap-8 text-[15px] leading-relaxed text-ink">
          <section>
            <h2 className="text-xl font-semibold">1. Agreeing to these terms</h2>
            <p className="mt-2 text-muted">
              By creating an account or using TeenovateX Labs, you agree to these terms. If you don&rsquo;t agree,
              don&rsquo;t use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Who can use this</h2>
            <p className="mt-2 text-muted">
              TeenovateX is built for teenagers. This draft doesn&rsquo;t yet set an exact minimum age or a
              parental-consent requirement &mdash; that needs to be decided (and actually enforced at signup)
              before this section is final. If you&rsquo;re signing up on behalf of, or with permission from, a
              parent or guardian where required, make sure that&rsquo;s actually true.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Your account</h2>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
              <li>One account per person. Use your real name and a working email.</li>
              <li>Keep your password to yourself, and pick a strong one.</li>
              <li>You&rsquo;re responsible for what happens under your account.</li>
              <li>Tell us if you think someone else has access to it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Community guidelines</h2>
            <p className="mt-2 text-muted">Don&rsquo;t use TeenovateX to:</p>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
              <li>Harass, bully, or threaten anyone.</li>
              <li>Post anything illegal, hateful, sexually explicit, or otherwise harmful.</li>
              <li>Submit a project you didn&rsquo;t build or don&rsquo;t have the right to share.</li>
              <li>Try to manipulate votes, points, or the leaderboard.</li>
              <li>Attack, scrape, or abuse the platform&rsquo;s systems.</li>
              <li>Impersonate someone else.</li>
            </ul>
            <p className="mt-2 text-muted">
              We can remove content or suspend accounts that break these rules, especially anything that puts
              another member&rsquo;s safety at risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Your projects &amp; content</h2>
            <p className="mt-2 text-muted">
              You keep ownership of what you submit. By posting a project, you give TeenovateX a license to
              display it on the platform (and reasonably promote it, e.g. on a leaderboard or social post) &mdash;
              nothing more. You&rsquo;re responsible for making sure you actually have the rights to whatever
              you submit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Points, streaks &amp; leaderboards</h2>
            <p className="mt-2 text-muted">
              Points, streaks, and leaderboard rank exist for fun and recognition inside TeenovateX. They have no
              cash value, aren&rsquo;t redeemable for anything outside the platform, and can be adjusted or reset
              if something&rsquo;s clearly being gamed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Suspending or ending an account</h2>
            <p className="mt-2 text-muted">
              You can delete your account at any time from settings. We can suspend or remove an account that
              seriously or repeatedly breaks these terms, especially anything that endangers another member.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. No warranty</h2>
            <p className="mt-2 text-muted">
              TeenovateX is provided &ldquo;as is.&rdquo; We&rsquo;re a young, actively-changing platform &mdash;
              things will occasionally break, and we don&rsquo;t guarantee uninterrupted availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Changes to these terms</h2>
            <p className="mt-2 text-muted">
              If we change these terms in a way that matters, we&rsquo;ll update the date at the top and, for
              anything significant, let you know directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="mt-2 text-muted">
              Questions about these terms:{" "}
              <a href="mailto:hello@teenovatex.org" className="text-rose underline underline-offset-4">
                hello@teenovatex.org
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
