"use client";

/**
 * ZoningStatisticsTable — Renders the industry-standard "Zoning Statistics"
 * table with REQUIRED and EXISTING BLDG columns.
 *
 * Data comes from `data.zoning_statistics_table` in the /lookup response.
 * When no data is available the component renders nothing.
 */

import { useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface ZoningStatsRow {
  label: string;
  required: string;
  existing: string;
  note?: string;
}

interface ZoningStatsMetadata {
  has_3d_massing_data?: boolean;
  has_user_input?: boolean;
  has_parcel_area?: boolean;
  has_parcel_frontage?: boolean;
  has_front_yard_averaging?: boolean;
}

export interface ZoningStatisticsData {
  zone_code?: string;
  zone_label?: string;
  rows?: ZoningStatsRow[];
  metadata?: ZoningStatsMetadata;
  error?: string;
}

/* ── Row category helpers ──────────────────────────────────────────────── */

function getCategory(label: string): string {
  const l = label.toUpperCase();
  if (l === "USE") return "use";
  if (l.includes("LOT FRONTAGE") || l.includes("LOT AREA")) return "lot";
  if (l.includes("HEIGHT") || l.includes("STOREYS")) return "height";
  if (l.includes("BUILDING LENGTH") || l.includes("BUILDING DEPTH")) return "building";
  if (l.includes("FSI") || l.includes("GFA")) return "density";
  if (l.includes("COVERAGE")) return "coverage";
  if (l.includes("YARD SB") || l.includes("SETBACK")) return "setback";
  if (l.includes("LANDSCAPING") || l.includes("LANDSCAPE")) return "landscaping";
  if (l.includes("PARKING")) return "parking";
  return "other";
}

const CATEGORY_ICON: Record<string, string> = {
  use: "🏘️",
  lot: "📐",
  height: "📏",
  building: "🏗️",
  density: "📊",
  coverage: "🏠",
  setback: "↔️",
  landscaping: "🌿",
  parking: "🅿️",
  other: "📋",
};

/* ── Component ─────────────────────────────────────────────────────────── */

export default function ZoningStatisticsTable({
  data,
}: {
  data: ZoningStatisticsData | null | undefined;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;
  if (data.error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
        <span className="font-semibold">Zoning Statistics:</span> {data.error}
      </div>
    );
  }
  if (!data.rows || data.rows.length === 0) return null;

  const { zone_label, rows, metadata } = data;

  // Pre-compute which rows start a new category group (avoids mutation during render)
  const isNewGroup = rows.map((row, i) =>
    i > 0 ? getCategory(row.label) !== getCategory(rows[i - 1].label) : false,
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* ── Header / toggle ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-stone-50/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[15px]" aria-hidden="true">📋</span>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Zoning Statistics
            </h4>
            {zone_label && (
              <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                {zone_label}
              </p>
            )}
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-stone-300 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* ── Collapsible body ───────────────────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-stone-100">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_minmax(110px,170px)_minmax(110px,170px)] bg-stone-50 px-5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              Standard
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 text-right">
              Required
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 text-right">
              Existing&nbsp;Bldg
            </span>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-stone-50">
            {rows.map((row, i) => {
              const cat = getCategory(row.label);
              const newGroup = isNewGroup[i];

              const isLandscaping = cat === "landscaping";
              const isDash =
                !row.existing ||
                row.existing === "—" ||
                row.existing === "\u2014" ||
                row.existing.startsWith("— (") ||
                row.existing.startsWith("\u2014 (");

              return (
                <div key={i}>
                  {/* Thin divider between categories */}
                  {newGroup && <div className="border-t border-stone-100" />}

                  {/* Main row */}
                  <div
                    className={`grid grid-cols-[1fr_minmax(110px,170px)_minmax(110px,170px)] items-baseline px-5 py-2.5 ${
                      isLandscaping
                        ? "bg-emerald-50/30"
                        : i % 2 === 0
                          ? "bg-white"
                          : "bg-stone-50/40"
                    }`}
                  >
                    {/* Label */}
                    <div className="flex items-center gap-2 min-w-0 pr-3">
                      <span className="text-[12px] leading-none shrink-0" aria-hidden="true">
                        {CATEGORY_ICON[cat] ?? ""}
                      </span>
                      <span className="text-[12px] font-medium text-stone-700 break-words">
                        {row.label}
                      </span>
                    </div>

                    {/* Required */}
                    <span
                      className={`text-[13px] font-semibold text-right whitespace-nowrap ${
                        isLandscaping ? "text-emerald-800" : "text-stone-900"
                      }`}
                    >
                      {row.required}
                    </span>

                    {/* Existing */}
                    <span
                      className={`text-[13px] text-right whitespace-nowrap ${
                        isDash
                          ? "text-stone-300 italic"
                          : "font-medium text-stone-700"
                      }`}
                    >
                      {row.existing}
                    </span>
                  </div>

                  {/* Note sub-row */}
                  {row.note && (
                    <div
                      className={`px-5 pb-2 -mt-1 ${
                        isLandscaping ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <p className="ml-7 text-[10px] italic text-stone-400 leading-tight">
                        {row.note}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer metadata notes */}
          {(metadata?.has_3d_massing_data || metadata?.has_front_yard_averaging) && (
            <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-3 space-y-1.5">
              {metadata?.has_front_yard_averaging && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] leading-none shrink-0" aria-hidden="true">📐</span>
                  <p className="text-[10px] text-stone-400 leading-snug">
                    Front yard setback estimated from neighbour building
                    footprints (3D Massing)
                  </p>
                </div>
              )}
              {metadata?.has_3d_massing_data && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] leading-none shrink-0" aria-hidden="true">✅</span>
                  <p className="text-[10px] text-emerald-600 leading-snug">
                    Existing building data from City of Toronto 3D Massing Open
                    Data
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
