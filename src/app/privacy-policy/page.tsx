import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | TeenovateX Labs",
  description: "How TeenovateX Labs collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="wrap max-w-[720px] py-14">
        <p className="eyebrow text-rose">Legal</p>
        <h1 className="mt-2 text-[38px] leading-[1.1] tracking-[-0.03em] md:text-[48px]">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted">Last updated: September 29, 2026</p>

        <div className="mt-6 rounded-md border border-ink bg-pink/20 p-4 text-sm">
          <strong>This is a draft, not legal advice.</strong> It describes what the product actually does today
          in plain language, but it hasn&rsquo;t been reviewed by a lawyer. Have one look it over &mdash;
          especially the children&rsquo;s-privacy section &mdash; before this is the real policy people rely on.
        </div>

        <div className="prose-legal mt-8 flex flex-col gap-8 text-[15px] leading-relaxed text-ink">
          <section>
            <h2 className="text-xl font-semibold">Who we are</h2>
            <p className="mt-2 text-muted">
              TeenovateX Labs (&ldquo;we,&rdquo; &ldquo;us&rdquo;) runs a community platform for teenagers
              building and showcasing tech projects. This policy covers the website, the account system, and
              anything else built on teenovatex.org.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">What we collect</h2>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
              <li>
                <strong className="text-ink">Account info:</strong> full name, username, email address, and a
                password (stored as a one-way hash, never in plain text) &mdash; or, if you sign in with Google,
                your Google account ID, name, email, and profile picture instead.
              </li>
              <li>
                <strong className="text-ink">Profile info you add:</strong> avatar, bio, and any social links you
                choose to show.
              </li>
              <li>
                <strong className="text-ink">Activity:</strong> projects you submit, votes, points, streaks, and
                follows &mdash; the things that make the community and leaderboard work.
              </li>
              <li>
                <strong className="text-ink">Login sessions:</strong> device/browser info and IP address tied to
                each login session, so you can see and revoke them from settings.
              </li>
              <li>
                <strong className="text-ink">Nothing else on purpose.</strong> We don&rsquo;t run ad trackers or
                sell data to advertisers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">How we use it</h2>
            <p className="mt-2 text-muted">To run the account system and the community itself: signing you in,</p>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
              <li>verifying your email and resetting your password when you ask,</li>
              <li>showing your projects, points, and rank to other members,</li>
              <li>keeping the platform secure &mdash; rate-limiting, fraud/abuse prevention, session management,</li>
              <li>emailing you things you specifically triggered (a verification code, a password reset link).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Who else sees it</h2>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
              <li>
                <strong className="text-ink">Google</strong>, if you use Google Sign-In &mdash; only to verify your
                identity; we don&rsquo;t see or store your Google password.
              </li>
              <li>
                <strong className="text-ink">Resend</strong>, our email provider, to deliver verification codes
                and password-reset emails.
              </li>
              <li>
                <strong className="text-ink">Our hosting/database providers</strong>, who store the data on our
                behalf and don&rsquo;t use it for anything else.
              </li>
              <li>We don&rsquo;t sell your data, and we don&rsquo;t share it with advertisers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Cookies &amp; local storage</h2>
            <p className="mt-2 text-muted">
              We use your browser&rsquo;s local storage to keep you signed in between visits (or, if you don&rsquo;t
              check &ldquo;Remember me&rdquo;, only for the current session). We don&rsquo;t use third-party
              advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Your choices</h2>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-muted">
              <li>Edit or remove your profile info any time from settings.</li>
              <li>Turn off notification emails from settings.</li>
              <li>See and revoke individual login sessions from settings.</li>
              <li>Delete your account and its data from settings, at any time.</li>
              <li>
                Email <a href="mailto:hello@teenovatex.org" className="text-rose underline underline-offset-4">hello@teenovatex.org</a> for
                anything settings can&rsquo;t do yet.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Children&rsquo;s privacy</h2>
            <p className="mt-2 text-muted">
              TeenovateX is built for teenagers, and some members will be minors. This draft doesn&rsquo;t yet
              describe a specific minimum age, parental-consent process, or region-specific safeguard (like
              COPPA in the US, or the UK/EU Age-Appropriate Design rules) &mdash; those need to be decided and
              actually built (an age gate at signup, a consent flow, etc.) before this section is accurate. Treat
              this as the most important paragraph to get a lawyer&rsquo;s eyes on.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="mt-2 text-muted">
              Passwords are hashed (never stored in plain text), sessions are tokenized, and sensitive endpoints
              are rate-limited against brute-force attempts. No system is perfectly secure, but we take
              reasonable, industry-standard steps to protect your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Changes to this policy</h2>
            <p className="mt-2 text-muted">
              If this policy changes in a way that matters, we&rsquo;ll update the date at the top and, for
              anything significant, let you know directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="mt-2 text-muted">
              Questions about this policy or your data:{" "}
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
