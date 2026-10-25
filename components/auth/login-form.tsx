"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [linkFailed, setLinkFailed] = useState(false);

  // The callback sends ?error=auth when a link is invalid or expired.
  useEffect(() => {
    setLinkFailed(new URLSearchParams(window.location.search).has("error"));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/board`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p role="status" className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-700">
        Check your email for a sign-in link. You can close this tab after you
        open it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {linkFailed && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          That sign-in link is invalid or has expired. Request a new one.
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </button>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          Couldn't send the link. Check the address and try again in a minute.
        </p>
      )}
    </form>
  );
}