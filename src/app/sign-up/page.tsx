"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignUp() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setConfirmSent(true);
    setLoading(false);
  }

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
          <div className="text-3xl mb-4">📧</div>
          <h2 className="text-lg font-semibold text-stone-900">Check your email</h2>
          <p className="mt-2 text-[13px] text-stone-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block rounded-lg bg-stone-900 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-stone-800 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-[15px] font-bold tracking-tight text-stone-900">
            Toronto Zoning
          </Link>
          <p className="mt-2 text-[13px] text-stone-500">
            Create an account to save reports and submit feedback
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-stone-900">Create account</h1>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-[12px] text-red-600">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Full name</span>
            <input
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </label>

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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-[12px] text-stone-500">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-stone-900 underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
