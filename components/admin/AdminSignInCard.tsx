"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

type AdminSignInCardProps = {
  errorCode?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "This Google account is not authorized for the admin dashboard.",
  Configuration: "Authentication is not configured correctly. Please review the server logs.",
  default: "We couldn’t complete the sign-in request. Please try again."
};

const AdminSignInCard = ({ errorCode }: AdminSignInCardProps) => {
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.default
    : null;

  const handleSignIn = () => {
    void signIn("google", {
      callbackUrl: "/admin/projects",
      prompt: "select_account"
    });
  };

  return (
    <div className="w-full max-w-md rounded-[32px] border border-brand-secondary/70 bg-white/95 p-10 text-center shadow-lg backdrop-blur">
      <p className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
        Admin access
      </p>
      <h1 className="mt-4 text-3xl font-medium uppercase tracking-tightest">
        Sign in with Google
      </h1>
      <p className="mt-4 text-sm text-text-muted">
        Only approved studio accounts can create or publish projects.
      </p>
      {errorMessage ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleSignIn}
        className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full border border-text px-6 py-3 font-condensed text-xs uppercase tracking-[0.32em] transition hover:bg-brand-secondary"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="#EA4335"
            d="M12.24 10.29v3.48h4.96c-.2 1.13-1.2 3.3-4.96 3.3-2.98 0-5.41-2.47-5.41-5.52s2.43-5.52 5.41-5.52c1.7 0 2.84.72 3.49 1.33l2.38-2.3C16.64 3.42 14.65 2.5 12.24 2.5 6.91 2.5 2.58 6.87 2.58 12s4.33 9.5 9.66 9.5c5.58 0 9.27-3.94 9.27-9.48 0-.64-.07-1.13-.16-1.63z"
          />
        </svg>
        Continue with Google
      </button>
      <p className="mt-6 text-xs text-text-muted">
        Trouble signing in? Contact your system administrator to get your email
        allow-listed.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center text-xs uppercase tracking-[0.32em] text-text underline-offset-2 hover:underline"
      >
        ← Back to site
      </Link>
    </div>
  );
};

export default AdminSignInCard;


