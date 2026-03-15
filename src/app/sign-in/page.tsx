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

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-stone-900">Sign in</h1>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-[12px] text-red-600">
              {error}
            </p>
          )}

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

          <p className="text-center text-[12px] text-stone-500">
            No account?{" "}
            <Link href="/sign-up" className="font-medium text-stone-900 underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
