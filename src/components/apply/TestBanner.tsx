/** Shown on every applicant screen of a test (rehearsal) window, so nobody mistakes it for the real thing. */
export default function TestBanner() {
  return (
    <div role="note" className="mb-4 rounded-md border border-ink bg-yellow p-3 text-sm">
      <p className="font-bold">Test window: this is a rehearsal.</p>
      <p className="mt-0.5">Nothing here is a real application. Emails only reach team inboxes, no account can be created from it, and the whole window is deleted afterwards.</p>
    </div>
  );
}
