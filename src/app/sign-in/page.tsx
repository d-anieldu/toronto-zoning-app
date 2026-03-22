"use client";

import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleLinkedIn() {
    await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[15px] font-bold tracking-tight text-stone-900">
            Toronto Zoning
          </Link>
          <p className="mt-2 text-[13px] text-stone-500">
            Sign in to save reports and manage projects
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-stone-900">Sign in</h1>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-[12px] text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleLinkedIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Continue with LinkedIn
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
            <div className="relative flex justify-center text-[11px]"><span className="bg-white px-2 text-stone-400">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          </form>

          <p className="text-center text-[12px] text-stone-500">
            No account?{" "}
            <Link href="/sign-up" className="font-medium text-stone-900 underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
