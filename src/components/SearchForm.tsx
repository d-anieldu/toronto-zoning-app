"use client";

import { useState } from "react";
import ZoningReport from "./ZoningReport";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZoningData = Record<string, any>;

const EXAMPLE_ADDRESSES = [
  "226 Viewmount Ave",
  "100 Queen St W",
  "671 St Clair Ave W",
  "89 Argyle St",
];

export default function SearchForm() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ZoningData | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
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

  function handleQuickFill(addr: string) {
    setAddress(addr);
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter a Toronto address — e.g. 226 Viewmount Ave"
              className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-10 pr-4 text-[14px] text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="rounded-xl bg-stone-900 px-6 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Looking up…
              </span>
            ) : (
              "Look up"
            )}
          </button>
        </div>

        {/* Quick-fill examples */}
        {!data && !loading && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
              Try:
            </span>
            {EXAMPLE_ADDRESSES.map((addr) => (
              <button
                key={addr}
                type="button"
                onClick={() => handleQuickFill(addr)}
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[12px] text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700"
              >
                {addr}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Loading state */}
      {loading && (
        <div className="mt-10 flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-stone-200" />
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-stone-900" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-stone-700">
            Querying zoning layers…
          </p>
          <p className="mt-1 text-[12px] text-stone-400">
            Resolving standards from 19 GIS layers
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-red-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </span>
            <div>
              <p className="text-[13px] font-semibold text-red-700">
                Lookup failed
              </p>
              <p className="mt-0.5 text-[13px] text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && <ZoningReport data={data} />}
    </div>
  );
}
