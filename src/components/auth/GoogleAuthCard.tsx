"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

/** The fast-path into an account — Google auth, dressed as a card that
 * belongs on this site rather than a bare stock button dropped in. */
export default function GoogleAuthCard({
  text,
  onSuccess,
  onError,
}: {
  text: "signup_with" | "signin_with";
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError: () => void;
}) {
  return (
    <div className="rounded-md border border-ink bg-yellow p-3 shadow-[5px_5px_0_var(--ink)] transition-transform hover:-translate-y-0.5">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="filled_black"
          shape="pill"
          size="large"
          text={text}
        />
      </div>
    </div>
  );
}
