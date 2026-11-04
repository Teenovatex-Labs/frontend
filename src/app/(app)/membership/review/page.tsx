"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { membershipApi } from "@/lib/services";
import { keys } from "@/lib/labs";

export default function MembershipReviewPage() {
  const toast = useToast();
  const review = useQuery({ queryKey: keys.admin("my-membership-review"), queryFn: membershipApi.myReview });
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const respond = useMutation({
    mutationFn: () => membershipApi.respond(message.trim()),
    onSuccess: () => { setSent(true); toast.success("Sent. Thanks for letting us know."); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't send that."),
  });

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Membership" title="How are you" accent="doing?">
        We haven&rsquo;t seen you in a while, so we wanted to check in before anything changes.
      </PageHeader>

      <div className="mt-8">
        {review.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : !review.data?.review ? (
          <Card className="p-5 text-center text-muted">Nothing to respond to right now.</Card>
        ) : review.data.review.responded || sent ? (
          <Card className="p-5 text-center">Thanks — we&rsquo;ve got your response.</Card>
        ) : (
          <Card className="flex flex-col gap-3 p-5">
            <p className="text-sm text-muted">Respond by {new Date(review.data.review.response_due_at).toLocaleDateString()}. A quick note is enough.</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={1000} placeholder="Tell us what's going on…" className="w-full rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-rose" />
            <button type="button" onClick={() => respond.mutate()} disabled={respond.isPending || message.trim().length < 2} className="btn self-start disabled:opacity-60">
              {respond.isPending ? "Sending…" : "Send"}
            </button>
          </Card>
        )}
      </div>
    </main>
  );
}
