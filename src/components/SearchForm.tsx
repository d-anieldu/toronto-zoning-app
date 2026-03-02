"use client";

import { useState } from "react";
import ZoningReport from "./ZoningReport";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZoningData = Record<string, any>;

export default function SearchForm() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ZoningData | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Lookup failed (${res.status})`);
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter an address — e.g. 226 Viewmount Ave"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[14px] text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Looking up…
            </span>
          ) : (
            "Look up"
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {data && <ZoningReport data={data} />}
    </div>
  );
}
