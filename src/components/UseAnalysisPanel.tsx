"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from "react";
import { RefLink } from "./ReferencePanel";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface ChecklistItem {
  id: string;
  text: string;
  status: "pass" | "fail" | "unknown" | "info";
  detail: string;
  reg_ref: string | null;
  category: string;
}

interface ParkingImpact {
  note: string;
  additional_spaces_required: number | null;
  use_key_for_lookup?: string;
  parking_rate?: any;
}

interface AnalysisResult {
  use: string;
  display_name: string;
  is_building_type: boolean;
  permission: "permitted" | "conditional" | "not_listed";
  eligibility: "eligible" | "conditional" | "not_eligible" | "unknown";
  checklist: ChecklistItem[];
  parking_impact: ParkingImpact;
  summary: string;
  bylaw_refs: string[];
  zone_code: string;
  zone_family: string;
  pass_count?: number;
  fail_count?: number;
  unknown_count?: number;
  unmapped?: boolean;
  description?: string;
}

interface UseAnalysisPanelProps {
  /** The use name to analyze */
  useName: string | null;
  /** The full report data to send to the backend */
  reportData: Record<string, any> | null;
  /** Called when the panel should close */
  onClose: () => void;
}

/* ================================================================== */
/*  STATUS ICONS & COLORS                                              */
/* ================================================================== */

const STATUS_CONFIG: Record<
  string,
  { icon: string; bg: string; text: string; border: string; label: string }
> = {
  pass: {
    icon: "✓",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Met",
  },
  fail: {
    icon: "✗",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Not Met",
  },
  unknown: {
    icon: "?",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Verify",
  },
  info: {
    icon: "ℹ",
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-200",
    label: "Info",
  },
};

const ELIGIBILITY_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  eligible: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    icon: "✓",
    label: "Eligible",
  },
  conditional: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    icon: "⚠",
    label: "Needs Verification",
  },
  not_eligible: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
    icon: "✗",
    label: "Not Eligible",
  },
  unknown: {
    bg: "bg-stone-50",
    text: "text-stone-600",
    border: "border-stone-300",
    icon: "?",
    label: "Unknown",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  use_requirement: "Use Requirements",
  building_requirement: "Building Requirements",
  lot_requirement: "Lot Requirements",
  location_requirement: "Location Requirements",
  parking: "Parking",
};

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function UseAnalysisPanel({
  useName,
  reportData,
  onClose,
}: UseAnalysisPanelProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Fetch analysis when useName changes ── */
  useEffect(() => {
    if (!useName || !reportData) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);

    (async () => {
      try {
        const res = await fetch("/api/analyze-use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use: useName, report: reportData }),
        });
        if (!cancelled) {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            setError(errData.error || `Analysis failed (${res.status})`);
          } else {
            const data: AnalysisResult = await res.json();
            setResult(data);
          }
        }
      } catch {
        if (!cancelled) setError("Network error — could not reach server");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useName, reportData]);

  /* ── Close on Escape ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && useName) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [useName, onClose]);

  /* ── Group checklist items by category ── */
  const groupedChecklist = useCallback(
    (items: ChecklistItem[]) => {
      const groups: Record<string, ChecklistItem[]> = {};
      for (const item of items) {
        const cat = item.category || "other";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
      return groups;
    },
    []
  );

  const isOpen = !!useName;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-lg flex-col border-l border-stone-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div className="min-w-0">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                  Use Eligibility Analysis
                </span>
                <h3 className="mt-0.5 truncate text-[15px] font-semibold text-stone-900">
                  {result?.display_name || useName}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-500" />
                  <p className="mt-4 text-[13px] text-stone-400">
                    Analyzing eligibility…
                  </p>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <p className="text-[13px] font-medium text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* Result */}
              {result && !loading && (
                <div className="space-y-5">
                  {/* ── Eligibility verdict ── */}
                  <EligibilityBanner result={result} />

                  {/* ── Summary ── */}
                  {result.summary && (
                    <p className="text-[13px] leading-relaxed text-stone-600">
                      {result.summary}
                    </p>
                  )}

                  {/* ── Description (building types) ── */}
                  {result.description && (
                    <p className="text-[12px] italic text-stone-400">
                      {result.description}
                    </p>
                  )}

                  {/* ── Checklist ── */}
                  {result.checklist.length > 0 && (
                    <div>
                      <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                        Conditions Checklist
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(
                          groupedChecklist(result.checklist)
                        ).map(([category, items]) => (
                          <div key={category}>
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                              {CATEGORY_LABELS[category] || category}
                            </p>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <ChecklistCard key={item.id} item={item} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Unmapped notice ── */}
                  {result.unmapped && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[12px] text-stone-500">
                        Detailed conditions for this use have not yet been
                        mapped. Check the by-law text directly for specific
                        requirements.
                      </p>
                    </div>
                  )}

                  {/* ── Parking Impact ── */}
                  {result.parking_impact?.note && (
                    <div>
                      <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                        Parking Impact
                      </h4>
                      <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="text-[13px] text-stone-600">
                          {result.parking_impact.note}
                        </p>
                        {result.parking_impact.parking_rate && (
                          <p className="mt-2 text-[12px] text-stone-400">
                            Rate:{" "}
                            {typeof result.parking_impact.parking_rate ===
                            "string"
                              ? result.parking_impact.parking_rate
                              : JSON.stringify(
                                  result.parking_impact.parking_rate
                                )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Bylaw References ── */}
                  {result.bylaw_refs.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                        Bylaw References
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.bylaw_refs.map((ref) => (
                          <RefLink
                            key={ref}
                            type="bylaw-section"
                            id={ref}
                            label={`s. ${ref}`}
                          >
                            <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[12px] font-medium text-indigo-700 transition-colors hover:bg-indigo-100">
                              📖 s. {ref}
                            </span>
                          </RefLink>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Score bar ── */}
                  {(result.pass_count != null ||
                    result.fail_count != null ||
                    result.unknown_count != null) && (
                    <ScoreBar
                      pass={result.pass_count || 0}
                      fail={result.fail_count || 0}
                      unknown={result.unknown_count || 0}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

function EligibilityBanner({ result }: { result: AnalysisResult }) {
  const config = ELIGIBILITY_CONFIG[result.eligibility] || ELIGIBILITY_CONFIG.unknown;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${config.bg} ${config.border}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg} ${config.text} text-[16px] font-bold`}
      >
        {config.icon}
      </span>
      <div>
        <p className={`text-[14px] font-semibold ${config.text}`}>
          {config.label}
        </p>
        <p className="text-[12px] text-stone-500">
          {result.is_building_type ? "Building Type" : "Use"} in{" "}
          {result.zone_code} zone
          {result.permission === "conditional" &&
            " — conditionally permitted"}
          {result.permission === "permitted" && " — permitted outright"}
          {result.permission === "not_listed" && " — not listed in this zone"}
        </p>
      </div>
    </div>
  );
}

function ChecklistCard({ item }: { item: ChecklistItem }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.unknown;

  return (
    <div
      className={`rounded-lg border p-3 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${config.text} ${config.bg}`}
          style={{
            border: `1.5px solid currentColor`,
          }}
        >
          {config.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-stone-700">{item.text}</p>
          {item.detail && item.detail !== item.text && (
            <p className={`mt-0.5 text-[12px] ${config.text}`}>
              {item.detail}
            </p>
          )}
          {item.reg_ref && (
            <div className="mt-1.5">
              <RefLink
                type="bylaw-section"
                id={item.reg_ref}
                label={`s. ${item.reg_ref}`}
              >
                <span className="text-[11px] text-indigo-500 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-700">
                  s. {item.reg_ref}
                </span>
              </RefLink>
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.bg} ${config.text}`}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({
  pass,
  fail,
  unknown,
}: {
  pass: number;
  fail: number;
  unknown: number;
}) {
  const total = pass + fail + unknown;
  if (total === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-400">
        <span>Condition Verification</span>
        <span>
          {pass} of {total} verified
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-stone-100">
        {pass > 0 && (
          <div
            className="bg-emerald-400 transition-all duration-500"
            style={{ width: `${(pass / total) * 100}%` }}
          />
        )}
        {fail > 0 && (
          <div
            className="bg-red-400 transition-all duration-500"
            style={{ width: `${(fail / total) * 100}%` }}
          />
        )}
        {unknown > 0 && (
          <div
            className="bg-amber-300 transition-all duration-500"
            style={{ width: `${(unknown / total) * 100}%` }}
          />
        )}
      </div>
      <div className="mt-1.5 flex gap-4 text-[10px]">
        {pass > 0 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {pass} met
          </span>
        )}
        {fail > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            {fail} not met
          </span>
        )}
        {unknown > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            {unknown} to verify
          </span>
        )}
      </div>
    </div>
  );
}
