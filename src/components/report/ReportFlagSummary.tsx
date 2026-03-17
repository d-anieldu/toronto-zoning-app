"use client";

import { useState, useEffect } from "react";
import { Flag, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface FlagItem {
  id: string;
  status: string;
  field_path: string;
  field_label: string | null;
  tab_name: string | null;
  current_value: string | null;
  suggested_value: string | null;
  reason: string | null;
  source_url: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  label: "Pending" },
  reviewing: { bg: "bg-sky-50",    text: "text-sky-700",    label: "Reviewing" },
  accepted:  { bg: "bg-emerald-50", text: "text-emerald-700", label: "Accepted" },
  rejected:  { bg: "bg-red-50",    text: "text-red-700",    label: "Rejected" },
  duplicate: { bg: "bg-stone-100", text: "text-stone-500",  label: "Duplicate" },
};

interface ReportFlagSummaryProps {
  reportId: string;
}

export default function ReportFlagSummary({ reportId }: ReportFlagSummaryProps) {
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/reports/${reportId}/flags`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setFlags(json.flags ?? []);
      } catch {
        // silently ignore — non-critical UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [reportId]);

  if (loading) return null;
  if (flags.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm" data-no-pdf>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-stone-800">
            Flagged Values
          </span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
            {flags.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-4">
          <div className="divide-y divide-stone-100">
            {flags.map((flag) => {
              const style = STATUS_STYLES[flag.status] ?? STATUS_STYLES.pending;
              return (
                <div key={flag.id} className="py-3 first:pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-800">
                          {flag.field_label || flag.field_path}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      {flag.tab_name && (
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-stone-400">
                          {flag.tab_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {flag.suggested_value && (
                    <div className="mt-1.5 flex items-baseline gap-2 text-[12px]">
                      <span className="text-stone-400">Suggested:</span>
                      <span className="font-medium text-stone-700">
                        {flag.suggested_value}
                      </span>
                    </div>
                  )}

                  {flag.reason && (
                    <p className="mt-1 text-[12px] text-stone-500">{flag.reason}</p>
                  )}

                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[11px] text-stone-400">
                      {new Date(flag.created_at).toLocaleDateString("en-CA")}
                    </span>
                    {flag.source_url && (
                      <a
                        href={flag.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
