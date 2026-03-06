"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * /compare — Multi-property comparison page.
 * Add 2-10 addresses, runs backend /compare, displays side-by-side table.
 */

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface CompareResult {
  properties: any[];
  count: number;
  comparison_fields: string[];
}

/* ── Field display config ── */
const FIELD_CONFIG: Record<string, { label: string; fmt: (v: any) => string }> = {
  zone_code: { label: "Zone Code", fmt: (v) => v || "—" },
  max_height_m: { label: "Max Height (m)", fmt: (v) => (v != null ? `${v}m` : "—") },
  max_storeys: { label: "Max Storeys", fmt: (v) => (v != null ? `${v}` : "—") },
  fsi: { label: "FSI", fmt: (v) => (v != null ? `${v}` : "—") },
  max_gfa_sqm: { label: "Max GFA (m²)", fmt: (v) => (v != null ? `${Number(v).toLocaleString()}` : "—") },
  lot_area_sqm: { label: "Lot Area (m²)", fmt: (v) => (v != null ? `${Number(v).toLocaleString()}` : "—") },
  lot_frontage_m: { label: "Lot Frontage (m)", fmt: (v) => (v != null ? `${v}` : "—") },
  coverage_pct: { label: "Coverage %", fmt: (v) => (v != null ? `${v}%` : "—") },
  exception_number: { label: "Exception #", fmt: (v) => v || "None" },
  heritage: { label: "Heritage", fmt: (v) => (v ? "Yes 🏛️" : "No") },
  site_plan_required: { label: "Site Plan Req.", fmt: (v) => (v == null ? "—" : v ? "Yes" : "No") },
  dc_total: { label: "Dev Charges (est.)", fmt: (v) => (v != null ? `$${Number(v).toLocaleString()}` : "—") },
  confidence_score: { label: "Confidence", fmt: (v) => (v != null ? `${v}%` : "—") },
  constraints_count: { label: "Constraints", fmt: (v) => (v != null ? `${v}` : "—") },
  building_types: { label: "Building Types", fmt: (v) => (Array.isArray(v) && v.length ? v.join(", ") : "—") },
};

export default function ComparePage() {
  const [addresses, setAddresses] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateAddress(idx: number, val: string) {
    const next = [...addresses];
    next[idx] = val;
    setAddresses(next);
  }

  function addAddress() {
    if (addresses.length >= 10) return;
    setAddresses([...addresses, ""]);
  }

  function removeAddress(idx: number) {
    if (addresses.length <= 2) return;
    setAddresses(addresses.filter((_, i) => i !== idx));
  }

  async function runCompare() {
    const valid = addresses.filter((a) => a.trim());
    if (valid.length < 2) {
      setError("Enter at least 2 addresses");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: valid }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Comparison failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to compare properties");
    } finally {
      setLoading(false);
    }
  }

  const validCount = addresses.filter((a) => a.trim()).length;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[14px] font-medium text-stone-600">Compare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              ← Back to Lookup
            </Link>
            <Link
              href="/projects"
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              Projects
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-[24px] font-bold tracking-tight text-stone-900 mb-6">
          Compare Properties
        </h1>

        {/* Address inputs */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm mb-6">
          <p className="text-[13px] text-stone-500 mb-4">
            Enter 2–10 Toronto addresses for a side-by-side zoning comparison.
          </p>
          <div className="space-y-2">
            {addresses.map((addr, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[12px] font-bold text-stone-500">
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={addr}
                  onChange={(e) => updateAddress(i, e.target.value)}
                  placeholder={`Address ${i + 1} — e.g. ${i === 0 ? "446 Roselawn Ave" : "89 Argyle St"}`}
                  className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[13px] focus:border-stone-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && i === addresses.length - 1) addAddress();
                  }}
                />
                {addresses.length > 2 && (
                  <button
                    onClick={() => removeAddress(i)}
                    className="rounded-lg border border-stone-200 px-2.5 text-[13px] text-stone-400 hover:bg-stone-50 hover:text-stone-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {addresses.length < 10 && (
              <button
                onClick={addAddress}
                className="rounded-lg border border-dashed border-stone-300 px-4 py-2 text-[12px] font-medium text-stone-500 hover:border-stone-400 hover:text-stone-700"
              >
                + Add Address
              </button>
            )}
            <button
              onClick={runCompare}
              disabled={loading || validCount < 2}
              className="rounded-xl bg-stone-900 px-6 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              {loading
                ? "Comparing…"
                : `Compare ${validCount} Propert${validCount !== 1 ? "ies" : "y"}`}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
            <p className="mt-3 text-[13px] text-stone-400">
              Looking up {validCount} properties — this may take a moment…
            </p>
          </div>
        )}

        {/* Results table */}
        {result && result.properties.length > 0 && (
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="sticky left-0 z-10 bg-stone-50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Field
                    </th>
                    {result.properties.map((prop, i) => (
                      <th key={i} className="min-w-[160px] px-4 py-3 text-left">
                        <p className="text-[12px] font-semibold text-stone-900 truncate max-w-[180px]">
                          {prop.address || prop.error || `Property ${i + 1}`}
                        </p>
                        {prop.zone_code && (
                          <span className="mt-0.5 inline-block rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-stone-600">
                            {prop.zone_code}
                          </span>
                        )}
                        {prop.error && (
                          <span className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                            Error
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(FIELD_CONFIG).map(([field, cfg], rowIdx) => {
                    const values = result.properties.map((p) => p[field]);
                    const allSame =
                      values.length > 1 &&
                      values.every((v) => JSON.stringify(v) === JSON.stringify(values[0]));
                    const hasDiff = !allSame && values.some((v) => v != null);

                    return (
                      <tr
                        key={field}
                        className={`border-b border-stone-50 ${
                          rowIdx % 2 === 0 ? "" : "bg-stone-50/50"
                        } ${hasDiff ? "bg-amber-50/30" : ""}`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 font-medium text-stone-600 whitespace-nowrap">
                          {cfg.label}
                          {hasDiff && (
                            <span className="ml-1 text-[9px] text-amber-500">●</span>
                          )}
                        </td>
                        {result.properties.map((prop, ci) => {
                          const val = prop[field];
                          const formatted = cfg.fmt(val);
                          // Highlight best / worst
                          const isBest =
                            hasDiff &&
                            typeof val === "number" &&
                            val === Math.max(...values.filter((v: any) => typeof v === "number"));

                          return (
                            <td
                              key={ci}
                              className={`px-4 py-2.5 font-mono ${
                                prop.error
                                  ? "text-stone-300"
                                  : isBest
                                  ? "font-bold text-emerald-700"
                                  : "text-stone-800"
                              }`}
                            >
                              {prop.error ? "—" : formatted}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="border-t border-stone-100 px-4 py-3 flex items-center gap-4 text-[10px] text-stone-400">
              <span>
                <span className="text-amber-500">●</span> = values differ
              </span>
              <span>
                <span className="font-bold text-emerald-700">Bold green</span> = highest numeric value
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
